import { HapticFeedbackControl, NO_HAPTIC_FEEDBACK } from 'uniswap/src/features/settings/useHapticFeedback/types'
import { noop } from 'utilities/src/react/noop'

export function useHapticFeedback(): HapticFeedbackControl {
  // No haptic feedback on web
  return {
    hapticFeedback: NO_HAPTIC_FEEDBACK,
    hapticsEnabled: false,
    setHapticsEnabled: noop,
  }
}
