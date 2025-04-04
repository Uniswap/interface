import { datadogRum } from '@datadog/browser-rum'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { TradeType } from '@uniswap/sdk-core'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { clientToProvider } from 'hooks/useEthersProvider'
import ms from 'ms'
import { Action } from 'redux'
import { addTransaction, finalizeTransaction, updateTransactionInfo } from 'state/transactions/reducer'
import {
  ApproveTransactionInfo,
  BridgeTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionDetails,
  TransactionInfo,
  TransactionType,
  VitalTxFields,
} from 'state/transactions/types'
import { isPendingTx } from 'state/transactions/utils'
import { InterfaceState } from 'state/webReducer'
import { SagaGenerator, call, cancel, delay, fork, put, race, select, take } from 'typed-redux-saga'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import {
  ApprovalEditedInWalletError,
  HandledTransactionInterrupt,
  TransactionStepFailedError,
  UnexpectedTransactionStateError,
} from 'uniswap/src/features/transactions/errors'
import {
  OnChainTransactionStep,
  SignatureTransactionStep,
  TokenApprovalTransactionStep,
  TokenRevocationTransactionStep,
  TransactionStep,
  TransactionStepType,
} from 'uniswap/src/features/transactions/swap/types/steps'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { BridgeTrade, ClassicTrade, UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'

import { parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'
import { interruptTransactionFlow } from 'uniswap/src/utils/saga'
import { isSameAddress } from 'utilities/src/addresses'
import { percentFromFloat } from 'utilities/src/format/percent'
import { Sentry } from 'utilities/src/logger/Sentry'
import noop from 'utilities/src/react/noop'
import { currencyId } from 'utils/currencyId'
import { signTypedData } from 'utils/signing'
import { Transaction } from 'viem'
import { getConnectorClient, getTransaction } from 'wagmi/actions'

export interface HandleSignatureStepParams<T extends SignatureTransactionStep = SignatureTransactionStep> {
  account: AccountMeta
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
  const signature = yield* call(signTypedData, signer, step.domain, step.types, step.values) // TODO(WEB-5077): look into removing / simplifying signTypedData
  // If the transaction flow was interrupted, throw an error after the step has completed
  yield* call(throwIfInterrupted)

  addTransactionBreadcrumb({ step, data: { signature }, status: 'complete' })

  return signature
}

export interface HandleOnChainStepParams<T extends OnChainTransactionStep = OnChainTransactionStep> {
  account: AccountMeta
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
  const { account, step, setCurrentStep, info, allowDuplicativeTx, ignoreInterrupt, onModification } = params
  const { chainId } = step.txRequest

  addTransactionBreadcrumb({ step, data: { ...info } })

  // Avoid sending prompting a transaction if the user already submitted an equivalent tx, e.g. by closing and reopening a transaction flow
  const duplicativeTx = yield* findDuplicativeTx(info, account, chainId, allowDuplicativeTx)
  if (duplicativeTx) {
    if (duplicativeTx.status === TransactionStatus.Confirmed) {
      addTransactionBreadcrumb({ step, data: { duplicativeTx: true, hash: duplicativeTx.hash }, status: 'complete' })
      return duplicativeTx.hash
    } else {
      addTransactionBreadcrumb({ step, data: { duplicativeTx: true, hash: duplicativeTx.hash }, status: 'in progress' })
      setCurrentStep({ step, accepted: true })
      return yield* handleOnChainConfirmation(params, duplicativeTx.hash)
    }
  }

  // Add a watcher to check if the transaction flow during user input
  const { throwIfInterrupted } = yield* watchForInterruption(ignoreInterrupt)

  // Trigger UI prompting user to accept
  setCurrentStep({ step, accepted: false })

  // Prompt wallet to submit transaction
  const { hash, nonce, data } = yield* call(submitTransaction, params)

  // Trigger waiting UI after user accepts
  setCurrentStep({ step, accepted: true })

  // Add transaction to local state to start polling for status
  yield* put(addTransaction({ from: account.address, info, hash, nonce, chainId }))

  if (step.txRequest.data !== data && onModification) {
    yield* call(onModification, { hash, data, nonce })
  }

  // If the transaction flow was interrupted while awaiting input, throw an error after input is received
  yield* call(throwIfInterrupted)

  return yield* handleOnChainConfirmation(params, hash)
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

  addTransactionBreadcrumb({ step, data: { txHash: hash }, status: 'complete' })

  return hash
}

/** Submits a transaction and handles potential wallet errors */
function* submitTransaction(params: HandleOnChainStepParams): SagaGenerator<VitalTxFields> {
  const { account, step } = params
  const signer = yield* call(getSigner, account.address)

  try {
    const response = yield* call([signer, 'sendTransaction'], step.txRequest)
    return transformTransactionResponse(response)
  } catch (error) {
    if (error && typeof error === 'object' && 'transactionHash' in error) {
      return yield* recoverTransactionFromHash(error.transactionHash as `0x${string}`, step)
    }
    throw error
  }
}

/** Polls for transaction details when only hash is known */
function* recoverTransactionFromHash(hash: `0x${string}`, step: OnChainTransactionStep): SagaGenerator<VitalTxFields> {
  const transaction = yield* pollForTransaction(hash, step.txRequest.chainId)

  if (!transaction) {
    throw new TransactionStepFailedError({ message: `Transaction not found`, step })
  }

  return transformTransactionResponse(transaction)
}

/** Polls until transaction is found or timeout is reached */
function* pollForTransaction(hash: `0x${string}`, chainId: number) {
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

interface HandleApprovalStepParams
  extends Omit<HandleOnChainStepParams<TokenApprovalTransactionStep | TokenRevocationTransactionStep>, 'info'> {}
export function* handleApprovalTransactionStep(params: HandleApprovalStepParams) {
  const { step } = params
  const info = getApprovalTransactionInfo(step)
  return yield* call(handleOnChainStep, {
    ...params,
    info,
    *onModification({ hash, data }: VitalTxFields) {
      const { isInsufficient, approvedAmount } = checkApprovalAmount(data, step)

      // Update state to reflect hte actual approval amount submitted on-chain
      yield* put(
        updateTransactionInfo({
          chainId: step.txRequest.chainId,
          hash,
          info: { ...info, amount: approvedAmount },
        }),
      )

      if (isInsufficient) {
        throw new ApprovalEditedInWalletError({ step })
      }
    },
  })
}

function getApprovalTransactionInfo(
  approvalStep: TokenApprovalTransactionStep | TokenRevocationTransactionStep,
): ApproveTransactionInfo {
  return {
    type: TransactionType.APPROVAL,
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

function isRecentTx(tx: TransactionDetails) {
  const currentTime = Date.now()
  const failed = tx.status === TransactionStatus.Failed
  return !failed && currentTime - tx.addedTime < ms('30s') // 30s is an arbitrary upper limit to combat e.g. a duplicative approval to be included in tx steps, caused by polling intervals.
}

function* findDuplicativeTx(
  info: TransactionInfo,
  account: AccountMeta,
  chainId: number,
  allowDuplicativeTx?: boolean,
) {
  if (allowDuplicativeTx) {
    return undefined
  }

  const transactionMap = (yield* select((state: InterfaceState) => state.localWebTransactions[chainId])) ?? {}
  const transactionsForAccount = Object.values(transactionMap).filter((tx) => isSameAddress(tx.from, account.address))

  // Check all pending and recent transactions
  return transactionsForAccount.find(
    (tx) => (isPendingTx(tx) || isRecentTx(tx)) && JSON.stringify(tx.info) === JSON.stringify(info),
  )
}

// Saga to wait for the specific action while asyncTask is running
function* watchForInterruption(ignoreInterrupt = false) {
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
function* waitForTransaction(hash: string, step: TransactionStep) {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof finalizeTransaction>>(finalizeTransaction.type)
    if (payload.hash === hash) {
      if (payload.status === TransactionStatus.Confirmed) {
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

async function getSigner(account: string): Promise<JsonRpcSigner> {
  return (await getProvider()).getSigner(account)
}

type SwapInfo = ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
export function getSwapTransactionInfo(trade: ClassicTrade | BridgeTrade): SwapInfo | BridgeTransactionInfo
export function getSwapTransactionInfo(trade: UniswapXTrade): SwapInfo & { isUniswapXOrder: true }
export function getSwapTransactionInfo(
  trade: ClassicTrade | BridgeTrade | UniswapXTrade,
): SwapInfo | BridgeTransactionInfo {
  if (trade.routing === Routing.BRIDGE) {
    return {
      type: TransactionType.BRIDGE,
      inputCurrencyId: currencyId(trade.inputAmount.currency),
      inputChainId: trade.inputAmount.currency.chainId,
      outputCurrencyId: currencyId(trade.outputAmount.currency),
      outputChainId: trade.outputAmount.currency.chainId,
      inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
      outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
      quoteId: trade.quote.requestId,
      depositConfirmed: false,
    }
  }

  const slippage = percentFromFloat(trade.slippageTolerance)

  return {
    type: TransactionType.SWAP,
    inputCurrencyId: currencyId(trade.inputAmount.currency),
    outputCurrencyId: currencyId(trade.outputAmount.currency),
    isUniswapXOrder: isUniswapX(trade),
    ...(trade.tradeType === TradeType.EXACT_INPUT
      ? {
          tradeType: TradeType.EXACT_INPUT,
          inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
          expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
          minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(slippage).quotient.toString(),
        }
      : {
          tradeType: TradeType.EXACT_OUTPUT,
          maximumInputCurrencyAmountRaw: trade.maximumAmountIn(slippage).quotient.toString(),
          outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
          expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
        }),
  }
}

export function addTransactionBreadcrumb({
  step,
  data = {},
  status = 'initiated',
}: {
  step: TransactionStep
  data?: {
    [key: string]: string | number | boolean | undefined
  }
  status?: 'initiated' | 'complete' | 'in progress' | 'interrupted'
}) {
  datadogRum.addAction('Transaction Action', {
    message: `${step.type} ${status}`,
    step: step.type,
    level: 'info',
    data,
  })

  Sentry.addBreadCrumb({
    level: 'info',
    category: 'transaction',
    message: `${step.type} ${status}`,
    data,
  })
}
