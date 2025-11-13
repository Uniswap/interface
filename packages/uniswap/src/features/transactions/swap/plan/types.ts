import { SagaGenerator } from 'typed-redux-saga'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import {
  HandleApprovalStepParams,
  HandleSignatureStepParams,
  HandleSwapStepParams,
  TransactionStep,
} from 'uniswap/src/features/transactions/steps/types'
import { ExtractedBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { SwapExecutionCallbacks } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'

export interface PlanParams extends SwapExecutionCallbacks {
  account: { address: Address }
  swapTxContext: ValidatedSwapTxContext
  selectChain: (chainId: number) => Promise<boolean>
  analytics: PlanSagaAnalytics
  getOnPressRetry?: (error: Error | undefined) => (() => void) | undefined
  onTransactionHash?: (hash: string) => void
  handleApprovalTransactionStep: (params: HandleApprovalStepParams) => SagaGenerator<string>
  handleSwapTransactionStep: (params: HandleSwapStepParams) => SagaGenerator<string>
  handleSignatureStep: (params: HandleSignatureStepParams) => SagaGenerator<string>
  getDisplayableError: ({
    error,
    step,
    flow,
  }: {
    error: Error
    step?: TransactionStep
    flow?: string
  }) => Error | undefined
}

export type PlanSagaAnalytics = SwapTradeBaseProperties | ExtractedBaseTradeAnalyticsProperties
