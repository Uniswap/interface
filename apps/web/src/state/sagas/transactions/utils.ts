import { JsonRpcSigner, TransactionResponse, Web3Provider } from '@ethersproject/providers'
import { TradeType } from '@uniswap/sdk-core'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { clientToProvider } from 'hooks/useEthersProvider'
import ms from 'ms'
import { Action } from 'redux'
import { addTransaction, finalizeTransaction } from 'state/transactions/reducer'
import {
  ApproveTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionDetails,
  TransactionInfo,
  TransactionType,
} from 'state/transactions/types'
import { isPendingTx } from 'state/transactions/utils'
import { InterfaceState } from 'state/webReducer'
import { SagaGenerator, call, cancel, fork, put, race, select, take } from 'typed-redux-saga'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import {
  HandledTransactionInterrupt,
  TransactionStepFailedError,
  UnexpectedTransactionStateError,
} from 'uniswap/src/features/transactions/errors'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { ClassicTrade, UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  OnChainTransactionStep,
  SignatureTransactionStep,
  TokenApprovalTransactionStep,
  TokenRevocationTransactionStep,
  TransactionStep,
} from 'uniswap/src/features/transactions/swap/utils/generateTransactionSteps'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { interruptTransactionFlow } from 'uniswap/src/utils/saga'
import { isSameAddress } from 'utilities/src/addresses'
import { percentFromFloat } from 'utilities/src/format/percent'
import { Sentry } from 'utilities/src/logger/Sentry'
import noop from 'utilities/src/react/noop'
import { currencyId } from 'utils/currencyId'
import { signTypedData } from 'utils/signing'
import { getConnectorClient } from 'wagmi/actions'

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
  onModification?: (response: TransactionResponse) => void
}
export function* handleOnChainStep<T extends OnChainTransactionStep>(params: HandleOnChainStepParams<T>) {
  const { account, step, setCurrentStep, info, allowDuplicativeTx, ignoreInterrupt, onModification } = params
  const { chainId } = step.txRequest
  const signer = yield* call(getSigner, account.address)

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
  const response = yield* call([signer, 'sendTransaction'], step.txRequest)
  const { hash, nonce, data } = response

  // Trigger waiting UI after user accepts
  setCurrentStep({ step, accepted: true })

  // Add transaction to local state to start polling for status
  yield* put(addTransaction({ from: account.address, info, hash, nonce, chainId }))

  if (step.txRequest.data !== data) {
    onModification?.(response)
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

interface HandleApprovalStepParams
  extends Omit<HandleOnChainStepParams<TokenApprovalTransactionStep | TokenRevocationTransactionStep>, 'info'> {}
export function* handleApprovalTransactionStep(params: HandleApprovalStepParams) {
  const { step } = params
  const info = getApprovalTransactionInfo(step)
  return yield* call(handleOnChainStep, { ...params, info })
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
        throw new TransactionStepFailedError({ message: `${step.type} failed during swap`, step })
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
export function getSwapTransactionInfo(trade: ClassicTrade): SwapInfo
export function getSwapTransactionInfo(trade: UniswapXTrade): SwapInfo & { isUniswapXOrder: true }
export function getSwapTransactionInfo(trade: ClassicTrade | UniswapXTrade): SwapInfo {
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
  Sentry.addBreadCrumb({
    level: 'info',
    category: 'transaction',
    message: `${step.type} ${status}`,
    data,
  })
}
