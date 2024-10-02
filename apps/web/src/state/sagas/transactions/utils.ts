import { JsonRpcSigner, TransactionResponse, Web3Provider } from '@ethersproject/providers'
import { TradeType } from '@uniswap/sdk-core'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { clientToProvider } from 'hooks/useEthersProvider'
import { addTransaction, finalizeTransaction } from 'state/transactions/reducer'
import {
  ApproveTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionInfo,
  TransactionType,
} from 'state/transactions/types'
import { call, put, take } from 'typed-redux-saga'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
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
import { currencyId } from 'uniswap/src/utils/currencyId'
import { percentFromFloat } from 'utilities/src/format/percent'
import { getConnectorClient } from 'wagmi/actions'

class MissingProviderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingProviderError'
  }
}
class TransactionFailureError extends Error {
  step: TransactionStep

  constructor(message: string, step: TransactionStep) {
    super(message)
    this.name = 'TransactionFailureError'
    this.step = step
  }
}

export interface HandleSignatureStepParams<T extends SignatureTransactionStep = SignatureTransactionStep> {
  step: T
  setCurrentStep: SetCurrentStepFn
}
export function* handleSignatureStep({ setCurrentStep, step }: HandleSignatureStepParams) {
  // Trigger UI prompting user to accept
  setCurrentStep({ step, accepted: false })

  const signer = yield* call(getSigner)
  const signature = yield* call([signer, '_signTypedData'], step.domain, step.types, step.values)

  return signature
}

export interface HandleOnChainStepParams<T extends OnChainTransactionStep = OnChainTransactionStep> {
  account: AccountMeta
  info: TransactionInfo
  step: T
  setCurrentStep: SetCurrentStepFn
  shouldWaitForConfirmation?: boolean
  onModification?: (response: TransactionResponse) => void
}
export function* handleOnChainStep<T extends OnChainTransactionStep>(params: HandleOnChainStepParams<T>) {
  const { account, step, setCurrentStep, info, shouldWaitForConfirmation = true, onModification } = params
  const signer = yield* call(getSigner)

  // Trigger UI prompting user to accept
  setCurrentStep({ step, accepted: false })

  const response = yield* call([signer, 'sendTransaction'], step.txRequest)
  const { hash, nonce, data } = response

  // Trigger waiting UI after user accepts
  setCurrentStep({ step, accepted: true })

  // Add transaction to local state to start polling for status
  yield* put(addTransaction({ from: account.address, info, hash, nonce, chainId: step.txRequest.chainId }))

  if (step.txRequest.data !== data) {
    onModification?.(response)
  }

  if (shouldWaitForConfirmation) {
    // Delay returning until transaction is confirmed
    yield* call(waitForTransaction, hash, step)
  }

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

/** Returns when a transaction is confirmed in local state. Throws an error if the transaction fails. */
function* waitForTransaction(hash: string, step: TransactionStep) {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof finalizeTransaction>>(finalizeTransaction.type)
    if (payload.hash === hash) {
      if (payload.status === TransactionStatus.Confirmed) {
        return
      } else {
        throw new TransactionFailureError('Transaction not successful', step)
      }
    }
  }
}

async function getProvider(): Promise<Web3Provider> {
  const client = await getConnectorClient(wagmiConfig)
  const provider = clientToProvider(client)

  if (!provider) {
    throw new MissingProviderError(`Failed to get provider during transaction flow`)
  }

  return provider
}

async function getSigner(): Promise<JsonRpcSigner> {
  return (await getProvider()).getSigner()
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
