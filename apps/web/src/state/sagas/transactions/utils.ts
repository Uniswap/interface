import { datadogRum } from '@datadog/browser-rum'
import type { TransactionResponse } from '@ethersproject/abstract-provider'
import type { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { TradeType } from '@uniswap/sdk-core'
import { FetchError, TradingApi } from '@universe/api'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { clientToProvider } from 'hooks/useEthersProvider'
import ms from 'ms'
import type { Action } from 'redux'
import { getRoutingForTransaction } from 'state/activity/utils'
import type { TransactionDetails, TransactionInfo, VitalTxFields } from 'state/transactions/types'
import { isPendingTx } from 'state/transactions/utils'
import type { InterfaceState } from 'state/webReducer'
import type { SagaGenerator } from 'typed-redux-saga'
import { call, cancel, delay, fork, put, race, select, spawn, take } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isL2ChainId, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { BlockedAsyncSubmissionChainIdsConfigKey, DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { getDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
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
  interfaceUpdateTransactionInfo,
} from 'uniswap/src/features/transactions/slice'
import type { TokenApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import type { Permit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'
import type { TokenRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import type {
  OnChainTransactionStep,
  SignatureTransactionStep,
  TransactionStep,
} from 'uniswap/src/features/transactions/steps/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import type { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import type { BridgeTrade, ClassicTrade, UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import type {
  ApproveTransactionInfo,
  BridgeTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  InterfaceTransactionDetails,
  Permit2ApproveTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getInterfaceTransaction, isInterfaceTransaction } from 'uniswap/src/features/transactions/types/utils'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { interruptTransactionFlow } from 'uniswap/src/utils/saga'
import { HexString, isValidHexString } from 'utilities/src/addresses/hex'
import { noop } from 'utilities/src/react/noop'
import { signTypedData } from 'utils/signing'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import type { Transaction } from 'viem'
import { getConnectorClient, getTransaction } from 'wagmi/actions'

export enum TransactionBreadcrumbStatus {
  Initiated = 'initiated',
  Complete = 'complete',
  InProgress = 'in progress',
  Interrupted = 'interrupted',
}

export interface HandleSignatureStepParams<T extends SignatureTransactionStep = SignatureTransactionStep> {
  account: AccountDetails
  step: T
  setCurrentStep: SetCurrentStepFn
  ignoreInterrupt?: boolean
}
export function* handleSignatureStep({ setCurrentStep, step, ignoreInterrupt, account }: HandleSignatureStepParams) {
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

  const signer = yield* call(getSigner, account.address)
  const signature = yield* call(signTypedData, { signer, domain: step.domain, types: step.types, value: step.values }) // TODO(WEB-5077): look into removing / simplifying signTypedData
  // If the transaction flow was interrupted, throw an error after the step has completed
  yield* call(throwIfInterrupted)

  addTransactionBreadcrumb({ step, data: { signature }, status: TransactionBreadcrumbStatus.Complete })

  return signature
}

export interface HandleOnChainStepParams<T extends OnChainTransactionStep = OnChainTransactionStep> {
  account: AccountDetails
  info: TransactionInfo
  step: T
  setCurrentStep: SetCurrentStepFn
  /** Controls whether the function allow submitting a duplicate tx (a tx w/ identical `info` to another recent/pending tx). Defaults to false. */
  allowDuplicativeTx?: boolean
  /** Controls whether the function should throw an error upon interrupt or not, defaults to `false`. */
  ignoreInterrupt?: boolean
  /** Controls whether the function should wait to return until after the transaction has confirmed. Defaults to `true`. */
  shouldWaitForConfirmation?: boolean
  /** Called when data returned from a submitted transaction differs from data originally sent to the wallet. */
  onModification?: (response: VitalTxFields) => void | Generator<unknown, void, unknown>
}
export function* handleOnChainStep<T extends OnChainTransactionStep>(params: HandleOnChainStepParams<T>) {
  const {
    account,
    step,
    setCurrentStep,
    info,
    allowDuplicativeTx,
    ignoreInterrupt,
    onModification,
    shouldWaitForConfirmation,
  } = params
  const { chainId } = step.txRequest

  addTransactionBreadcrumb({ step, data: { ...info } })

  // Avoid sending prompting a transaction if the user already submitted an equivalent tx, e.g. by closing and reopening a transaction flow
  const duplicativeTx = yield* findDuplicativeTx({ info, account, chainId, allowDuplicativeTx })

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

  let transaction: InterfaceTransactionDetails
  const createTransaction = (hash: string): InterfaceTransactionDetails => ({
    id: hash,
    from: account.address,
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
        from: account.address,
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

  // Prompt wallet to submit transaction
  // If should wait for confirmation, we block until the transaction is confirmed
  // Otherwise, we submit the transaction and return the hash immediately and spawn a detection task to check for modifications
  if (blockedAsyncSubmissionChainIds.includes(chainId) || shouldWaitForConfirmation) {
    const { hash, data, nonce } = yield* call(submitTransaction, params)
    transaction = createTransaction(hash)

    if (step.txRequest.data !== data && onModification) {
      yield* call(onModification, { hash, data, nonce })
    }
  } else {
    const hash = yield* call(submitTransactionAsync, params)
    transaction = createTransaction(hash)

    if (onModification) {
      yield* spawn(handleOnModificationAsync, { onModification, hash, step })
    }
  }

  // Trigger waiting UI after user accepts
  setCurrentStep({ step, accepted: true })

  // Add transaction to local state to start polling for status
  yield* put(addTransaction(transaction))

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

function* handleOnModificationAsync({
  onModification,
  hash,
  step,
}: {
  onModification: NonNullable<HandleOnChainStepParams['onModification']>
  hash: HexString
  step: OnChainTransactionStep
}) {
  const { data, nonce } = yield* call(recoverTransactionFromHash, hash, step)
  if (step.txRequest.data !== data) {
    yield* call(onModification, { hash, data, nonce })
  }
}

/** Submits a transaction and handles potential wallet errors */
function* submitTransaction(params: HandleOnChainStepParams): SagaGenerator<VitalTxFields> {
  const { account, step } = params
  const signer = yield* call(getSigner, account.address)

  try {
    const response = yield* call([signer, 'sendTransaction'], step.txRequest)
    return transformTransactionResponse(response)
  } catch (error) {
    if (error && typeof error === 'object' && 'transactionHash' in error && isValidHexString(error.transactionHash)) {
      return yield* recoverTransactionFromHash(error.transactionHash, step)
    }
    throw error
  }
}

/** Submits a transaction and handles potential wallet errors */
function* submitTransactionAsync(params: HandleOnChainStepParams): SagaGenerator<HexString> {
  const { account, step } = params
  const signer = yield* call(getSigner, account.address)

  try {
    const response = yield* call([signer.provider, 'send'], 'eth_sendTransaction', [
      { from: account.address, ...step.txRequest },
    ])

    if (!isValidHexString(response)) {
      throw new TransactionStepFailedError({ message: `Transaction failed, not a valid hex string: ${response}`, step })
    }

    return response
  } catch (error) {
    if (error && typeof error === 'object' && 'transactionHash' in error && isValidHexString(error.transactionHash)) {
      return error.transactionHash
    }

    throw error
  }
}

/** Polls for transaction details when only hash is known */
function* recoverTransactionFromHash(hash: HexString, step: OnChainTransactionStep): SagaGenerator<VitalTxFields> {
  const transaction = yield* pollForTransaction(hash, step.txRequest.chainId)

  if (!transaction) {
    throw new TransactionStepFailedError({ message: `Transaction not found`, step })
  }

  return transformTransactionResponse(transaction)
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

/** Transforms a TransactionResponse or a Transaction into { hash: string; data: string; nonce: number } */
function transformTransactionResponse(response: TransactionResponse | Transaction): VitalTxFields {
  if ('data' in response) {
    return { hash: response.hash, data: response.data, nonce: response.nonce }
  }
  return { hash: response.hash, data: response.input, nonce: response.nonce }
}

interface HandlePermitStepParams extends Omit<HandleOnChainStepParams<Permit2TransactionStep>, 'info'> {}
export function* handlePermitTransactionStep(params: HandlePermitStepParams) {
  const { step } = params
  const info = getPermitTransactionInfo(step)
  return yield* call(handleOnChainStep, { ...params, info })
}

interface HandleApprovalStepParams
  extends Omit<HandleOnChainStepParams<TokenApprovalTransactionStep | TokenRevocationTransactionStep>, 'info'> {}
export function* handleApprovalTransactionStep(params: HandleApprovalStepParams) {
  const { step, account } = params
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
          address: account.address,
          typeInfo: { ...info, approvalAmount: approvedAmount },
        }),
      )

      if (isInsufficient) {
        throw new ApprovalEditedInWalletError({ step })
      }
    },
  })
}

function getApprovalTransactionInfo(
  approvalStep: TokenApprovalTransactionStep | TokenRevocationTransactionStep | Permit2TransactionStep,
): ApproveTransactionInfo {
  return {
    type: TransactionType.Approve,
    tokenAddress: approvalStep.token.address,
    spender: approvalStep.spender,
    approvalAmount: approvalStep.amount,
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
  const requiredAmount = BigInt(`0x${parseInt(step.amount, 10).toString(16)}`)
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
  account,
  chainId,
  allowDuplicativeTx,
}: {
  info: TransactionInfo
  account: AccountDetails
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
    // TODO(INFRA-645): DO NOT REMOVE THIS OPTIONAL CHAINING OPERATOR UNTIL THE TYPE IS FIXED.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (state: InterfaceState) => state.transactions[account.address]?.[chainId] ?? {},
  )

  const transactionsForAccount = Object.values(transactionMap)
    .filter((tx) =>
      areAddressesEqual({
        addressInput1: { address: tx.from, chainId: tx.chainId },
        addressInput2: { address: account.address, chainId },
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
    return
  }

  while (true) {
    const { payload } = yield* take<ReturnType<typeof finalizeTransaction>>(finalizeTransaction.type)
    // Note: This function is only used for classic/bridge transactions that have immediate transaction hashes.
    // UniswapX orders use a different flow (handleUniswapXSignatureStep) and don't call this function.
    if (payload.id === hash) {
      if (payload.status === TransactionStatus.Success) {
        return
      } else {
        throw new TransactionStepFailedError({ message: `${step.type} failed on-chain`, step })
      }
    }
  }
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
export function getSwapTransactionInfo(
  trade: ClassicTrade | BridgeTrade | SolanaTrade,
): SwapInfo | BridgeTransactionInfo
export function getSwapTransactionInfo(trade: UniswapXTrade): SwapInfo & { isUniswapXOrder: true }
export function getSwapTransactionInfo(
  trade: ClassicTrade | BridgeTrade | UniswapXTrade | SolanaTrade,
): SwapInfo | BridgeTransactionInfo {
  if (trade.routing === TradingApi.Routing.BRIDGE) {
    return {
      type: TransactionType.Bridge,
      inputCurrencyId: currencyId(trade.inputAmount.currency),
      outputCurrencyId: currencyId(trade.outputAmount.currency),
      inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
      outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
      quoteId: trade.quote.requestId,
      depositConfirmed: false,
    }
  }

  return {
    type: TransactionType.Swap,
    inputCurrencyId: currencyId(trade.inputAmount.currency),
    outputCurrencyId: currencyId(trade.outputAmount.currency),
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
}: {
  error: Error
  step?: TransactionStep
  flow?: string
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
    })
  } else {
    return error
  }
}
