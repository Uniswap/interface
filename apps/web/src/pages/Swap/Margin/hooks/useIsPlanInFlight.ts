import { heldPlan } from '~/pages/Swap/Margin/hooks/marginExecutionGuards'
import { useMarginPlanExecution } from '~/pages/Swap/Margin/hooks/marginPlanExecutionStore'

// Shared single-flight guard: true while any margin plan (any intent) still holds the executor (see heldPlan).
// executePlan silently no-ops when this holds (the executor lock is already taken), so every management
// entry point (expanded-row action buttons + each action modal's CTA) gates on it, mirroring the OPEN
// CTA's decideOpenAction pre-emption.
export function useIsPlanInFlight(): boolean {
  return useMarginPlanExecution((s) => heldPlan(s) !== undefined)
}
