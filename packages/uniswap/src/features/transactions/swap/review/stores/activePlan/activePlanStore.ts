import { PlanResponse } from '@universe/api/src/clients/trading/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { isDevEnv } from 'utilities/src/environment/env'
import { devtools } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

export interface ActivePlanData {
  response: PlanResponse
  planId: string
  inputChainId: UniverseChainId
  steps: TransactionAndPlanStep[]
  proofPending: boolean
  currentStepIndex: number
}

export interface ActivePlanState {
  /** The currently active (foreground) plan */
  activePlan?: ActivePlanData
  /**
   * Plans that are still executing but the user navigated away from. While a plan can be retried,
   * Plans that are backgrounded are never meant to be resumed/can't be retried. */
  backgroundedPlans: Record<string, ActivePlanData>
  /** Defined when a plan is resumed to populate the swap form. */
  resumePlanSwapFormState?: Partial<SwapFormState>
  /** Plan IDs that have been requested for cancellation */
  cancelledPlanIds: Set<string>
  /**
   * The planId currently holding the execution lock, or null if no saga is executing.
   * Prevents `ActivePlanUpdater` polling from overwriting plan calldata mid-execution.
   * Scoped to a planId (rather than a boolean) because on mobile/extension, `takeEvery`
   * allows concurrent plan sagas — a boolean would let one saga's unlock clear another's lock.
   */
  executionLockPlanId: string | null
  actions: {
    /** Reset the active plan */
    resetActivePlan: () => void
    /** Reset the backgrounded plans */
    resetBackgroundedPlans: () => void
    /** Set the active plan */
    setActivePlan: (plan: ActivePlanData) => void
    /** Clear a specific plan from active or backgrounded */
    clearPlan: (planId: string) => void
    /** Move the current activePlan to backgroundedPlans */
    backgroundPlan: (planId: string) => void
    /** Mark a plan as cancelled (to stop saga execution) */
    markPlanCancelled: (planId: string) => void
    /** Check if a plan has been cancelled */
    isPlanCancelled: (planId: string) => boolean
    /** Clear a cancelled plan from tracking (after finalization) */
    clearCancelledPlan: (planId: string) => void
    /** Claim the execution lock for a specific planId */
    lockPlanForExecution: (planId: string) => void
    /** Release the execution lock only if the given planId still holds it */
    unlockPlanForExecution: (planId: string) => void
  }
}

export const activePlanStore = createStore<ActivePlanState>()(
  devtools(
    (set, get) => {
      return {
        activePlan: undefined,
        backgroundedPlans: {},
        cancelledPlanIds: new Set<string>(),
        executionLockPlanId: null,
        actions: {
          resetActivePlan(): void {
            // Does not clear executionLockPlanId — the saga's `finally` block
            // is exclusively responsible for releasing the execution lock.
            set({ activePlan: undefined })
          },
          resetBackgroundedPlans(): void {
            set({ backgroundedPlans: {} })
          },
          setActivePlan(plan: ActivePlanData): void {
            const { activePlan, backgroundedPlans } = get()

            let updatedBackgroundedPlans = { ...backgroundedPlans }

            if (updatedBackgroundedPlans[plan.planId]) {
              const { [plan.planId]: _, ...remaining } = updatedBackgroundedPlans
              updatedBackgroundedPlans = remaining
            }

            if (activePlan && activePlan.planId !== plan.planId) {
              updatedBackgroundedPlans[activePlan.planId] = activePlan
            }

            set({ activePlan: plan, backgroundedPlans: updatedBackgroundedPlans })
          },
          clearPlan(planId: string): void {
            const { activePlan, backgroundedPlans } = get()
            const updatedState: Partial<ActivePlanState> = {}

            if (activePlan && activePlan.planId === planId) {
              updatedState.activePlan = undefined
            }

            if (backgroundedPlans[planId]) {
              const { [planId]: _, ...remainingPlans } = backgroundedPlans
              updatedState.backgroundedPlans = remainingPlans
            }

            if (Object.keys(updatedState).length > 0) {
              set(updatedState)
            }
          },
          backgroundPlan(planId: string): void {
            const { activePlan, backgroundedPlans } = get()
            if (activePlan && activePlan.planId === planId) {
              set({
                activePlan: undefined,
                backgroundedPlans: {
                  ...backgroundedPlans,
                  [planId]: activePlan,
                },
              })
            }
          },
          markPlanCancelled(planId: string): void {
            const { cancelledPlanIds } = get()
            set({ cancelledPlanIds: new Set([...cancelledPlanIds, planId]) })
          },
          isPlanCancelled(planId: string): boolean {
            return get().cancelledPlanIds.has(planId)
          },
          clearCancelledPlan(planId: string): void {
            const { cancelledPlanIds } = get()
            const newSet = new Set([...cancelledPlanIds])
            newSet.delete(planId)
            set({ cancelledPlanIds: newSet })
          },
          lockPlanForExecution(planId: string): void {
            set({ executionLockPlanId: planId })
          },
          unlockPlanForExecution(planId: string): void {
            if (get().executionLockPlanId === planId) {
              set({ executionLockPlanId: null })
            }
          },
        },
      }
    },
    {
      name: 'activePlanStore',
      enabled: isDevEnv(),
      trace: true,
      traceLimit: 25,
    },
  ),
)
