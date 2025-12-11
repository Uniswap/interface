import { TradingApi } from '@universe/api'
import { SagaGenerator } from 'typed-redux-saga'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import {
  HandleApprovalStepParams,
  HandleSignatureStepParams,
  HandleSwapStepParams,
  HandleUniswapXPlanSignatureStepParams,
  SignatureTransactionStep,
  TransactionStep,
} from 'uniswap/src/features/transactions/steps/types'
import { ExtractedBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { SwapExecutionCallbacks } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'

export interface PlanParams extends SwapExecutionCallbacks {
  address: Address
  swapTxContext: ValidatedSwapTxContext
  selectChain: (chainId: number) => Promise<boolean>
  analytics: PlanSagaAnalytics
  getOnPressRetry?: (error: Error | undefined) => (() => void) | undefined
  onTransactionHash?: (hash: string) => void
  handleApprovalTransactionStep: (params: HandleApprovalStepParams<TradingApi.PlanStep>) => SagaGenerator<string>
  handleSwapTransactionStep: (params: HandleSwapStepParams<TradingApi.PlanStep>) => SagaGenerator<string>
  handleSignatureStep: (
    params: HandleSignatureStepParams<SignatureTransactionStep, TradingApi.PlanStep>,
  ) => SagaGenerator<string>
  handleUniswapXPlanSignatureStep: (params: HandleUniswapXPlanSignatureStepParams) => SagaGenerator<string>
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

/**
 * Plan saga error thrown when the plan saga fails in a way that the
 * plan should not be retried or reused.
 */
export class AbortPlanError extends Error {
  constructor(message: string, error?: Error | unknown) {
    super(message, { cause: error })
    this.name = 'AbortPlanError'
  }
}

/**
 * Plan error thrown that can still be retried. For example,
 * if the network was down or a TX failed on chain.
 */
export class ShouldRetryPlanError extends Error {
  constructor(message: string, error?: Error | unknown) {
    super(message, { cause: error })
    this.name = 'ShouldRetryPlanError'
  }
}

/**
 * Plan error thrown when there is an issue with the plan itself
 * such as an invalid state or missing steps.
 */
export class PlanValidationError extends Error {
  constructor(message: string, error?: Error | unknown) {
    super(message, { cause: error })
    this.name = 'PlanValidationError'
  }
}
