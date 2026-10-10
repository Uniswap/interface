/* oxlint-disable max-lines */
import { datadogRum } from '@datadog/browser-rum'
import type { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { TradeType } from '@uniswap/sdk-core'
import { FetchError, TradingApi } from '@universe/api'
import { UniverseChainId, areAddressesEqual } from '@universe/chains'
import { HexString, isValidHexString } from '@universe/encoding'
import { BlockedAsyncSubmissionChainIdsConfigKey, DynamicConfigs, getDynamicConfigValue } from '@universe/gating'
import ms from 'ms'
import type { Action } from 'redux'
import type { SagaGenerator } from 'typed-redux-saga'
import { call, cancel, delay, fork, put, race, select, spawn, take } from 'typed-redux-saga'
import { isL2ChainId, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { AppNotification, AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import {
  ApprovalEditedInWalletError,
  HandledTransactionInterrupt,
  TransactionError,
  TransactionStepFailedError,
  UnexpectedTransactionStateError,
} from 'uniswap/src/features/transactions/errors'
import {
  addTransaction,
  finalizeTransaction,
  interfaceApplyTransactionHashToBatch,
  interfaceUpdateTransactionInfo,
  type TransactionsState,
} from 'uniswap/src/features/transactions/slice'
import {
  TokenApprovalTransactionStep,
  TokenApprovalWalletCallStep,
} from 'uniswap/src/features/transactions/steps/approve'
import type { Permit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'
import { TokenRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import type {
  HandleApprovalStepParams,
  HandleOnChainPermit2TransactionStep,
  HandleOnChainStepParams,
  HandleSignatureStepParams,
  OnChainTransactionStep,
  TransactionStep,
} from 'uniswap/src/features/transactions/steps/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import type {
  BridgeTrade,
  ChainedActionTrade,
  ClassicTrade,
  UniswapXTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { isGasSponsoredTradeExecution, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import type {
  ApproveTransactionInfo,
  BridgeTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  InterfaceTransactionDetails,
  Permit2ApproveTransactionInfo,
  PlanSwapTransactionInfoFields,
  RwaSwapAnalytics,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getInterfaceTransaction, isInterfaceTransaction } from 'uniswap/src/features/transactions/types/utils'
import { parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'
import { getRequiredApprovalAmount } from '~/state/sagas/transactions/approvalAmount'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { interruptTransactionFlow } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { noop } from 'utilities/src/react/noop'
import { hexlifyTransaction } from 'utilities/src/transactions/hexlifyTransaction'
import type { Transaction } from 'viem'
import { getConnectorClient, getTransaction } from 'wagmi/actions'
import { wagmiConfig } from '~/connection/wagmiConfig'
import { DEFAULT_TXN_DISMISS_MS } from '~/constants/misc'
import { clientToProvider } from '~/hooks/useEthersProvider'
import { getRoutingForTransaction } from '~/state/activity/utils'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import type { TransactionDetails, VitalTxFields } from '~/state/transactions/types'
import { isPendingTx } from '~/state/transactions/utils'
import { signTypedData } from '~/utils/signing'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

export enum TransactionBreadcrumbStatus {
  Initiated = 'initiated',
  Complete = 'complete',
  InProgress = 'in progress',
  Interrupted = 'interrupted',
}

export function* handleSignatureStep({ setCurrentStep, step, ignoreInterrupt, address }: HandleSignatureStepParams) {
  // Add a watcher to check if the transaction flow is interrupted during this step
  const { throwIfInterrupted } = yield* watchForInterruption(ignoreInterrupt)

  addTransactionBreadcrumb({
    step,
    data: {
      domain: JSON.stringify(step.domain),
      values: JSON.stringify(step.values),
      types: JSON.stringify(step.types),
    },
  })

  // Trigger UI prompting user to accept
  setCurrentStep({ step, accepted: false })

  const signer = yield* call(getSigner, address)
  const signature = yield* call(signTypedData, { signer, domain: step.domain, types: step.types, value: step.values }) // TODO(WEB-5077): look into removing / simplifying signTypedData
  // If the transaction flow was interrupted, throw an error after the step has completed
  yield* call(throwIfInterrupted)

  addTransactionBreadcrumb({ step, data: { signature }, status: TransactionBreadcrumbStatus.Complete })

  return signature
}

export function* handleOnChainStep<T extends OnChainTransactionStep>(params: HandleOnChainStepParams<T>) {
  const {
    address,
    step,
    setCurrentStep,
    info,
    allowDuplicativeTx,
    ignoreInterrupt,
    onModification,
    shouldWaitForConfirmation,
    planId,
  } = params
  const { chainId } = step.txRequest

  addTransactionBreadcrumb({ step, data: { ...info } })

  // Avoid sending prompting a transaction if the user already submitted an equivalent tx, e.g. by closing and reopening a transaction flow
  const duplicativeTx = yield* findDuplicativeTx({ info, address, chainId, allowDuplicativeTx })

  const interfaceDuplicativeTx = duplicativeTx ? getInterfaceTransaction(duplicativeTx) : undefined
  if (interfaceDuplicativeTx && interfaceDuplicativeTx.hash) {
    if (interfaceDuplicativeTx.status === TransactionStatus.Success) {
      addTransactionBreadcrumb({
        step,
        data: { duplicativeTx: true, hash: interfaceDuplicativeTx.hash },
        status: TransactionBreadcrumbStatus.Complete,
      })
      return interfaceDuplicativeTx.hash
    } else {
      addTransactionBreadcrumb({
        step,
        data: { duplicativeTx: true, hash: interfaceDuplicativeTx.hash },
        status: TransactionBreadcrumbStatus.InProgress,
      })
      setCurrentStep({ step, accepted: true })
      return yield* handleOnChainConfirmation(params, interfaceDuplicativeTx.hash)
    }
  }

  // Add a watcher to check if the transaction flow during user input
  const { throwIfInterrupted } = yield* watchForInterruption(ignoreInterrupt)

  // Trigger UI prompting user to accept
  setCurrentStep({ step, accepted: false })

  const createTransaction = (hash: string): InterfaceTransactionDetails => ({
    id: hash,
    from: address,
    typeInfo: info,
    hash,
    chainId,
    routing: getRoutingForTransaction(info),
    transactionOriginType: TransactionOriginType.Internal,
    status: TransactionStatus.Pending,
    addedTime: Date.now(),
    options: {
      request: {
        to: step.txRequest.to,
        from: address,
        data: step.txRequest.data,
        value: step.txRequest.value,
        gasLimit: step.txRequest.gasLimit,
        gasPrice: step.txRequest.gasPrice,
        nonce: step.txRequest.nonce,
        chainId: step.txRequest.chainId,
      },
    },
  })

  const defaultBlockedAsyncSubmissionChainIds: UniverseChainId[] = []
  const blockedAsyncSubmissionChainIds = getDynamicConfigValue({
    config: DynamicConfigs.BlockedAsyncSubmissionChainIds,
    key: BlockedAsyncSubmissionChainIdsConfigKey.ChainIds,
    defaultValue: defaultBlockedAsyncSubmissionChainIds,
  })

  // Prompt wallet to submit transaction. The signer path blocks on the modification check so
  // onModification can abort the flow (e.g. ApprovalEditedInWalletError); the async path checks in the background.
  const useSignerSubmission = blockedAsyncSubmissionChainIds.includes(chainId) || shouldWaitForConfirmation
  const hash = yield* call(useSignerSubmission ? submitTransaction : submitTransactionAsync, params)
  const transaction = createTransaction(hash)

  // For plans, individual tx state and validation is handled by the backend
  if (!planId) {
    yield* put(addTransaction(transaction))
    if (onModification) {
      const modificationCheck = { onModification, hash, step }
      if (useSignerSubmission) {
        yield* call(checkForModification, modificationCheck)
      } else {
        yield* spawn(checkForModification, modificationCheck)
      }
    }
  }

  // Trigger waiting UI after user accepts
  setCurrentStep({ step, accepted: true })

  // If the transaction flow was interrupted while awaiting input, throw an error after input is received
  yield* call(throwIfInterrupted)

  if (!transaction.hash) {
    throw new TransactionStepFailedError({ message: `Transaction failed, no hash returned`, step })
  }

  return yield* handleOnChainConfirmation(params, transaction.hash)
}

/** Waits for a transaction to complete, or immediately throws if interrupted. */
function* handleOnChainConfirmation(params: HandleOnChainStepParams, hash: string): SagaGenerator<string> {
  const { step, shouldWaitForConfirmation = true, ignoreInterrupt } = params
  if (!shouldWaitForConfirmation) {
    return hash
  }

  // Delay returning until transaction is confirmed
  if (ignoreInterrupt) {
    yield* call(waitForTransaction, hash, step)
    return hash
  }

  const { interrupt }: { interrupt?: Action } = yield* race({
    transactionFinished: call(waitForTransaction, hash, step),
    interrupt: take(interruptTransactionFlow.type),
  })

  if (interrupt) {
    throw new HandledTransactionInterrupt('Transaction flow was interrupted')
  }

  addTransactionBreadcrumb({ step, data: { txHash: hash }, status: TransactionBreadcrumbStatus.Complete })

  return hash
}

/** Calls onModification if the submitted tx differs from the request. Skips the check if the tx can't be found. */
function* checkForModification({
  onModification,
  hash,
  step,
}: {
  onModification: NonNullable<HandleOnChainStepParams['onModification']>
  hash: HexString
  step: OnChainTransactionStep
}) {
  const transaction = yield* call(pollForTransaction, hash, step.txRequest.chainId)
  if (!transaction) {
    logger.warn('sagas/transactions/utils', 'checkForModification', 'Submitted transaction not found', {
      hash,
      chainId: step.txRequest.chainId,
    })
    return
  }

  const { data, nonce } = transformTransaction(transaction)
  if (step.txRequest.data !== data) {
    yield* call(onModification, { hash, data, nonce })
  }
}

/**
 * Submits through the ethers signer, which fills fields like gasLimit when missing.
 * `sendUncheckedTransaction` skips ethers' pre-send block read, which some connectors fetch outside UniRPC.
 */
function* submitTransaction(params: HandleOnChainStepParams): SagaGenerator<HexString> {
  const { address, step } = params
  const signer = yield* call(getSigner, address)

  try {
    const hash = yield* call([signer, 'sendUncheckedTransaction'], step.txRequest)

    if (!isValidHexString(hash)) {
      throw new TransactionStepFailedError({ message: `Transaction failed, not a valid hex string: ${hash}`, step })
    }

    return hash
  } catch (error) {
    if (error && typeof error === 'object' && 'transactionHash' in error && isValidHexString(error.transactionHash)) {
      // oxlint-disable-next-line typescript/no-unsafe-return -- biome-parity: oxlint is stricter here
      return error.transactionHash
    }
    throw error
  }
}

/** Submits a transaction and handles potential wallet errors */
function* submitTransactionAsync(params: HandleOnChainStepParams): SagaGenerator<HexString> {
  const { address, step } = params
  const signer = yield* call(getSigner, address)

  try {
    const hexlifiedTransactionRequest = hexlifyTransaction(step.txRequest)

    const response = yield* call([signer.provider, 'send'], 'eth_sendTransaction', [
      { from: address, ...hexlifiedTransactionRequest },
    ])

    if (!isValidHexString(response)) {
      throw new TransactionStepFailedError({ message: `Transaction failed, not a valid hex string: ${response}`, step })
    }

    return response
  } catch (error) {
    if (error && typeof error === 'object' && 'transactionHash' in error && isValidHexString(error.transactionHash)) {
      // oxlint-disable-next-line typescript/no-unsafe-return -- biome-parity: oxlint is stricter here
      return error.transactionHash
    }

    throw error
  }
}

/** Polls until transaction is found or timeout is reached */
function* pollForTransaction(hash: HexString, chainId: number) {
  const POLL_INTERVAL = 2_000
  const MAX_POLLING_TIME = isL2ChainId(chainId) ? 12_000 : 24_000
  let elapsed = 0

  while (elapsed < MAX_POLLING_TIME) {
    try {
      return yield* call(getTransaction, wagmiConfig, { chainId, hash })
    } catch {
      yield* delay(POLL_INTERVAL)
      elapsed += POLL_INTERVAL
    }
  }
  return null
}

function transformTransaction(transaction: Transaction): VitalTxFields {
  return { hash: transaction.hash, data: transaction.input, nonce: transaction.nonce }
}

export function* handlePermitTransactionStep(params: HandleOnChainPermit2TransactionStep) {
  const { step } = params
  const info = getPermitTransactionInfo(step)
  return yield* call(handleOnChainStep, { ...params, info })
}

export function* handleApprovalTransactionStep(params: HandleApprovalStepParams) {
  const { step, address } = params
  const info = getApprovalTransactionInfo(step)
  return yield* call(handleOnChainStep, {
    ...params,
    info,
    *onModification({ hash, data }: VitalTxFields) {
      const { isInsufficient, approvedAmount } = checkApprovalAmount(data, step)

      // Update state to reflect hte actual approval amount submitted on-chain
      yield* put(
        interfaceUpdateTransactionInfo({
          chainId: step.txRequest.chainId,
          id: hash,
          address,
          typeInfo: { ...info, approvalAmount: approvedAmount },
        }),
      )

      if (isInsufficient) {
        throw new ApprovalEditedInWalletError({ step })
      }
    },
  })
}

export function getApprovalTransactionInfo(
  approvalStep:
    | TokenApprovalTransactionStep
    | TokenApprovalWalletCallStep
    | TokenRevocationTransactionStep
    | Permit2TransactionStep,
): ApproveTransactionInfo {
  const pair = 'pair' in approvalStep ? approvalStep.pair : undefined
  const explicitTokenSymbol = 'tokenSymbol' in approvalStep ? approvalStep.tokenSymbol : undefined
  const tokenSymbol = explicitTokenSymbol ?? (pair ? `${pair[0].symbol}-${pair[1].symbol}` : undefined)

  return {
    type: TransactionType.Approve,
    tokenAddress: approvalStep.tokenAddress,
    spender: approvalStep.spender,
    approvalAmount: approvalStep.amount,
    tokenSymbol,
  }
}

function getPermitTransactionInfo(approvalStep: Permit2TransactionStep): Permit2ApproveTransactionInfo {
  return {
    type: TransactionType.Permit2Approve,
    tokenAddress: approvalStep.token.address,
    spender: approvalStep.spender,
    amount: approvalStep.amount,
  }
}

function checkApprovalAmount(data: string, step: TokenApprovalTransactionStep | TokenRevocationTransactionStep) {
  const requiredAmount = getRequiredApprovalAmount(step.amount)
  const submitted = parseERC20ApproveCalldata(data)
  const approvedAmount = submitted.amount.toString(10)

  // Special case: for revoke tx's, the approval is insufficient if anything other than an empty approval was submitted on chain.
  if (step.type === TransactionStepType.TokenRevocationTransaction) {
    return { isInsufficient: submitted.amount !== BigInt(0), approvedAmount }
  }

  return { isInsufficient: submitted.amount < requiredAmount, approvedAmount }
}

function isRecentTx(tx: InterfaceTransactionDetails | TransactionDetails) {
  const currentTime = Date.now()
  const failed = tx.status === TransactionStatus.Failed
  return !failed && currentTime - tx.addedTime < ms('30s') // 30s is an arbitrary upper limit to combat e.g. a duplicative approval to be included in tx steps, caused by polling intervals.
}

function* findDuplicativeTx({
  info,
  address,
  chainId,
  allowDuplicativeTx,
}: {
  info: TransactionTypeInfo
  address: Address
  chainId: number
  allowDuplicativeTx?: boolean
}) {
  if (allowDuplicativeTx) {
    return undefined
  }

  if (!isUniverseChainId(chainId)) {
    throw new Error(`Invalid chainId: ${chainId} is not a valid UniverseChainId`)
  }

  const transactionMap = yield* select(
    (state: { transactions: TransactionsState }) => state.transactions[address]?.[chainId] ?? {},
  )

  const transactionsForAccount = Object.values(transactionMap)
    .filter((tx) =>
      areAddressesEqual({
        addressInput1: { address: tx.from, chainId: tx.chainId },
        addressInput2: { address, chainId },
      }),
    )
    .filter(isInterfaceTransaction)

  // Check all pending and recent transactions
  return transactionsForAccount.find(
    (tx) => (isPendingTx(tx) || isRecentTx(tx)) && JSON.stringify(tx.typeInfo) === JSON.stringify(info),
  )
}

// Saga to wait for the specific action while asyncTask is running
export function* watchForInterruption(ignoreInterrupt = false) {
  if (ignoreInterrupt) {
    return { throwIfInterrupted: noop }
  }

  let wasInterrupted = false
  // In parallel to execution of the current step, we watch for an interrupt
  const watchForInterruptionTask = yield* fork(function* () {
    yield* take(interruptTransactionFlow.type)
    // If the `take` above returns, the interrupt action was dispatched.
    wasInterrupted = true
  })

  function* throwIfInterrupted() {
    // Wait for step to complete before checking if the flow was interrupted.
    if (wasInterrupted) {
      throw new HandledTransactionInterrupt('Transaction flow was interrupted')
    }

    yield* cancel(watchForInterruptionTask)
  }

  return { throwIfInterrupted }
}

/** Returns when a transaction is confirmed in local state. Throws an error if the transaction fails. */
function* waitForTransaction(hash: string | undefined, step: TransactionStep) {
  // If no hash is provided, there's nothing to wait for (e.g., cancelled/expired orders)
  if (!hash) {
    return undefined
  }

  while (true) {
    const { payload } = yield* take<ReturnType<typeof finalizeTransaction>>(finalizeTransaction.type)
    // Note: This function is only used for classic/bridge transactions that have immediate transaction hashes.
    // UniswapX orders use a different flow (handleUniswapXSignatureStep) and don't call this function.
    if (payload.id === hash) {
      if (payload.status === TransactionStatus.Success) {
        return payload
      } else {
        throw new TransactionStepFailedError({ message: `${step.type} failed on-chain`, step })
      }
    }
  }
}

/** Returns the hash of a batched transaction once confirmed by the wallet, else returns undefined if the batch fails. */
export function* waitForBatch(batchId: string, step: TransactionStep): SagaGenerator<string | undefined> {
  const { appliedTransactionHash, finalized } = yield* race({
    appliedTransactionHash: take<ReturnType<typeof interfaceApplyTransactionHashToBatch>>(
      interfaceApplyTransactionHashToBatch.type,
    ),
    finalized: waitForTransaction(batchId, step),
  })

  if (appliedTransactionHash) {
    return appliedTransactionHash.payload.hash
  }

  return finalized?.hash
}

// waitForBatch that also races a flow interrupt.
export function* waitForBatchInterruptible(batchId: string, step: TransactionStep): SagaGenerator<string | undefined> {
  const { interrupt, batchResult } = yield* race({
    batchResult: call(waitForBatch, batchId, step),
    interrupt: take(interruptTransactionFlow.type),
  })

  if (interrupt) {
    throw new HandledTransactionInterrupt('Transaction flow was interrupted')
  }

  return batchResult
}

async function getProvider(): Promise<Web3Provider> {
  const client = await getConnectorClient(wagmiConfig)
  const provider = clientToProvider(client)

  if (!provider) {
    throw new UnexpectedTransactionStateError(`Failed to get provider during transaction flow`)
  }

  return provider
}

export async function getSigner(account: string): Promise<JsonRpcSigner> {
  return (await getProvider()).getSigner(account)
}

type SwapInfo = ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
export function getSwapTransactionInfo(params: {
  trade: ClassicTrade | BridgeTrade | SolanaTrade | ChainedActionTrade
  swapStartTimestamp?: number
  planAnalytics?: PlanSwapTransactionInfoFields
  transactedUSDValue?: number
  rwaAnalytics?: RwaSwapAnalytics
  executedWithPaymaster?: boolean
}): SwapInfo | BridgeTransactionInfo
export function getSwapTransactionInfo(params: {
  trade: UniswapXTrade
  swapStartTimestamp?: number
  planAnalytics?: PlanSwapTransactionInfoFields
  transactedUSDValue?: number
  rwaAnalytics?: RwaSwapAnalytics
  executedWithPaymaster?: boolean
}): SwapInfo & { isUniswapXOrder: true }
export function getSwapTransactionInfo({
  trade,
  swapStartTimestamp,
  planAnalytics,
  transactedUSDValue,
  rwaAnalytics,
  executedWithPaymaster,
}: {
  trade: ClassicTrade | BridgeTrade | UniswapXTrade | SolanaTrade | ChainedActionTrade
  swapStartTimestamp?: number
  planAnalytics?: PlanSwapTransactionInfoFields
  transactedUSDValue?: number
  rwaAnalytics?: RwaSwapAnalytics
  /** Whether this execution actually routes gas through our paymaster (e.g. a walletCall step carrying
   *  paymasterService). isSponsored means "paymaster actually paid", not the quote's sponsorship offer. */
  executedWithPaymaster?: boolean
}): SwapInfo | BridgeTransactionInfo {
  const isSponsored = isGasSponsoredTradeExecution({ trade, executesViaPaymaster: Boolean(executedWithPaymaster) })
  const sponsorshipCampaignId =
    isSponsored && 'sponsorshipInfo' in trade.quote ? trade.quote.sponsorshipInfo?.campaign?.name : undefined
  const commonAttributes = {
    inputCurrencyId: currencyId(trade.inputAmount.currency),
    outputCurrencyId: currencyId(trade.outputAmount.currency),
    swapStartTimestamp,
    transactedUSDValue,
    isSponsored,
    sponsorshipCampaignId,
    ...rwaAnalytics,
    ...planAnalytics,
  }

  if (trade.routing === TradingApi.Routing.BRIDGE) {
    return {
      type: TransactionType.Bridge,
      ...commonAttributes,
      inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
      outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
      quoteId: trade.quote.requestId,
      depositConfirmed: false,
    }
  }

  return {
    type: TransactionType.Swap,
    ...commonAttributes,
    isUniswapXOrder: isUniswapX(trade),
    ...(trade.tradeType === TradeType.EXACT_INPUT
      ? {
          tradeType: TradeType.EXACT_INPUT,
          inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
          expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
          minimumOutputCurrencyAmountRaw: trade.minAmountOut.quotient.toString(),
        }
      : {
          tradeType: TradeType.EXACT_OUTPUT,
          maximumInputCurrencyAmountRaw: trade.maxAmountIn.quotient.toString(),
          outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
          expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
        }),
  }
}

export function addTransactionBreadcrumb({
  step,
  data = {},
  status = TransactionBreadcrumbStatus.Initiated,
}: {
  step: TransactionStep
  data?: {
    [key: string]: string | number | boolean | undefined | object | null
  }
  status?: TransactionBreadcrumbStatus
}) {
  datadogRum.addAction('Transaction Action', {
    message: `${step.type} ${status}`,
    step: step.type,
    level: 'info',
    data,
  })
}

export function getDisplayableError({
  error,
  step,
  flow = 'swap',
  isPlanStep = false,
}: {
  error: Error
  step?: TransactionStep
  flow?: string
  isPlanStep?: boolean
}): Error | undefined {
  const userRejected = didUserReject(error)
  // If the user rejects a request, or it's a known interruption e.g. trade update, we handle gracefully / do not show error UI
  if (userRejected || error instanceof HandledTransactionInterrupt) {
    const loggableMessage = userRejected ? 'user rejected request' : error.message // for user rejections, avoid logging redundant/long message
    if (step) {
      addTransactionBreadcrumb({
        step,
        status: TransactionBreadcrumbStatus.Interrupted,
        data: { message: loggableMessage },
      })
    }
    return undefined
  } else if (error instanceof TransactionError) {
    return error // If the error was already formatted as a TransactionError, we just propagate
  } else if (step) {
    const isBackendRejection = error instanceof FetchError
    return new TransactionStepFailedError({
      message: `${step.type} failed during ${flow}`,
      step,
      isBackendRejection,
      originalError: error,
      isPlanStep,
    })
  } else {
    return error
  }
}

export function* sendToast(appNotification: AppNotification, planId: string): SagaGenerator<void> {
  yield* call(() => {
    switch (appNotification.type) {
      case AppNotificationType.SwapPending: {
        popupRegistry.addPopup(
          {
            type: PopupType.Plan,
            planId,
          },
          planId,
          DEFAULT_TXN_DISMISS_MS,
        )
        break
      }
      case AppNotificationType.Transaction: {
        popupRegistry.addPopup(
          {
            type: PopupType.Plan,
            planId,
          },
          planId,
          DEFAULT_TXN_DISMISS_MS,
        )
        break
      }
      default: {
        logger.warn('swapSaga', 'sendToast', 'Unknown app notification type', appNotification)
        break
      }
    }
  })
}
