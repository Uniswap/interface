import type { PlanProgressStep } from 'uniswap/src/features/transactions/swap/plan/utils'

export interface PendingSwapButtonContentProps {
  disabled: boolean
  onSubmit: () => void
  /** Index into the plan progress estimates (PLAN_FETCH_STEP_INDEX = plan fetch; NO_ANIMATION_INDEX disables animation). */
  currentStepIndex: number
  steps: readonly PlanProgressStep[] | undefined
  submissionText?: string
  testID?: string
}

/**
 * Presentational pending button with an animated plan-progress bar. Progress comes in via props,
 * so it renders anywhere (e.g. the Earn review sheet) without the swap review store providers —
 * the swap flow uses the store-connected PendingSwapButton wrapper.
 *
 * Platform-specific implementations:
 * - Web: Uses CSS transitions (PendingSwapButtonContent.web.tsx)
 * - Native: Uses react-native-reanimated (PendingSwapButtonContent.native.tsx)
 */
export function PendingSwapButtonContent(_props: PendingSwapButtonContentProps): JSX.Element {
  throw new Error('PendingSwapButtonContent: Implemented in `.native.tsx` and `.web.tsx` files')
}
