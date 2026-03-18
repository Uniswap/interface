import { TradingApi } from '@universe/api'
import { SagaGenerator } from 'typed-redux-saga'
import { CAIP25Session } from 'uniswap/src/features/capabilities/caip25/types'
import { AppNotification } from 'uniswap/src/features/notifications/slice/types'
import type { SwapRouting, SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { HandledTransactionInterrupt } from 'uniswap/src/features/transactions/errors'
import {
  HandleApprovalStepParams,
  HandleSignatureStepParams,
  HandleSwapBatchedStepParams,
  HandleSwapStepSyncParams,
  HandleUniswapXPlanSignatureStepParams,
  SignatureTransactionStep,
  TransactionStep,
} from 'uniswap/src/features/transactions/steps/types'
import { ExtractedBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { SwapExecutionCallbacks } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { PlanSwapTransactionInfoFields } from 'uniswap/src/features/transactions/types/transactionDetails'

export interface PlanParams extends SwapExecutionCallbacks {
  address: Address
  swapTxContext: ValidatedSwapTxContext
  selectChain: (chainId: number) => Promise<boolean>
  analytics: PlanSagaAnalytics
  getOnPressRetry?: (error: Error | undefined) => (() => void) | undefined
  onTransactionHash?: (hash: string) => void
  handleApprovalTransactionStep: (params: HandleApprovalStepParams<TradingApi.PlanStep>) => SagaGenerator<string>
  handleSwapTransactionStep: (params: HandleSwapStepSyncParams<TradingApi.PlanStep>) => SagaGenerator<string>
  handleSwapTransactionBatchedStep: (
    params: HandleSwapBatchedStepParams,
  ) => SagaGenerator<{ batchId: string; hash?: string }>
  handleSignatureStep: (
    params: HandleSignatureStepParams<SignatureTransactionStep, TradingApi.PlanStep>,
  ) => SagaGenerator<string>
  handleUniswapXPlanSignatureStep: (params: HandleUniswapXPlanSignatureStepParams) => SagaGenerator<string>
  /**
   * General function to send a toast notification. Note that this needs to manage both
   * web and wallet so each caller will not have the same implementation.
   */
  sendToast: (appNotification: AppNotification, planId: string) => SagaGenerator<void>
  caip25Info: CAIP25Session | undefined
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

// Plan analytics fields added by planSaga when augmenting analytics
export interface PlanAnalyticsFields {
  plan_id?: string
  step_index?: number
  total_steps?: number
  total_non_error_steps?: number
  step_type?: string
  step_routing?: SwapRouting
  is_final_step?: boolean
}

export type PlanSagaAnalytics = (SwapTradeBaseProperties | ExtractedBaseTradeAnalyticsProperties) & PlanAnalyticsFields

/** Converts camelCase plan fields to snake_case analytics fields */
export function planAnalyticsToSnakeCase(fields?: PlanSwapTransactionInfoFields): PlanAnalyticsFields {
  return {
    plan_id: fields?.planId,
    step_index: fields?.stepIndex,
    total_steps: fields?.totalSteps,
    total_non_error_steps: fields?.totalNonErrorSteps,
    step_type: fields?.stepType,
    step_routing: fields?.stepRouting,
    is_final_step: fields?.isFinalStep,
  }
}

/** Converts snake_case analytics fields to camelCase plan fields */
export function planAnalyticsToCamelCase(analytics: PlanAnalyticsFields): PlanSwapTransactionInfoFields {
  return {
    planId: analytics.plan_id,
    stepIndex: analytics.step_index,
    totalSteps: analytics.total_steps,
    totalNonErrorSteps: analytics.total_non_error_steps,
    stepType: analytics.step_type,
    stepRouting: analytics.step_routing,
    isFinalStep: analytics.is_final_step,
  }
}

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

/**
 * Plan error thrown when the plan's refreshed price has moved beyond the acceptable threshold.
 * Extends HandledTransactionInterrupt so getDisplayableError returns undefined (no error dialog).
 */
export class PlanPriceChangeInterrupt extends HandledTransactionInterrupt {
  constructor() {
    super('Plan price changed beyond threshold')
    this.name = 'PlanPriceChangeInterrupt'
  }
}

/**
 * Expected plan error thrown when the plan saga is interrupted by a known condition
 * (e.g., modal closed during plan creation). This error is expected and should be
 * handled gracefully without retrying.
 */
export class ExpectedPlanError extends Error {
  constructor(message: string, error?: Error | unknown) {
    super(message, { cause: error })
    this.name = 'ExpectedPlanError'
  }
}

/**
 * Plan error thrown when polling for a plan step exceeds the maximum number of attempts.
 * Distinct from generic errors to allow targeted monitoring (e.g., Datadog filter on error.name).
 */
export class PlanStepTimeoutError extends Error {
  constructor(message: string, error?: Error | unknown) {
    super(message, { cause: error })
    this.name = 'PlanStepTimeoutError'
  }
}
