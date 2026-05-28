import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { type UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { type PlanAnalyticsFields } from 'uniswap/src/features/transactions/swap/plan/types'

const MAX_TRACKED_PLAN_SWAP_SIGNED_STEP_KEYS = 500
const loggedPlanSwapSignedStepKeys = new Map<string, string>()

function getPlanSwapSignedStepKey(analytics: PlanAnalyticsFields): string | undefined {
  if (analytics.plan_id === undefined || analytics.step_index === undefined) {
    return undefined
  }

  return `${analytics.plan_id}:${analytics.step_index}`
}

export function sendSwapSignedEvent(params: {
  analytics: PlanAnalyticsFields
  properties: UniverseEventProperties[SwapEventName.SwapSigned]
}): void {
  const { analytics, properties } = params
  const planStepKey = getPlanSwapSignedStepKey(analytics)

  if (planStepKey) {
    // Web can re-enter signing for the same chained plan step. During one
    // active execution, emit SwapSigned once per plan_id + step_index.
    if (loggedPlanSwapSignedStepKeys.has(planStepKey)) {
      return
    }

    loggedPlanSwapSignedStepKeys.set(planStepKey, analytics.plan_id!)

    if (loggedPlanSwapSignedStepKeys.size > MAX_TRACKED_PLAN_SWAP_SIGNED_STEP_KEYS) {
      const oldestTrackedPlanStepKey = loggedPlanSwapSignedStepKeys.keys().next().value

      if (oldestTrackedPlanStepKey) {
        loggedPlanSwapSignedStepKeys.delete(oldestTrackedPlanStepKey)
      }
    }
  }

  sendAnalyticsEvent(SwapEventName.SwapSigned, properties)
}

export function clearLoggedSwapSignedPlanSteps(planId: string): void {
  for (const [planStepKey, trackedPlanId] of loggedPlanSwapSignedStepKeys.entries()) {
    if (trackedPlanId === planId) {
      loggedPlanSwapSignedStepKeys.delete(planStepKey)
    }
  }
}

export function resetLoggedSwapSignedPlanSteps(): void {
  loggedPlanSwapSignedStepKeys.clear()
}
