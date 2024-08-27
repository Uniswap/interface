import { HapticFeedbackControl, NO_HAPTIC_FEEDBACK } from 'ui/src/utils/haptics/helpers'

export function useHapticFeedback(): HapticFeedbackControl {
  return {
    hapticFeedback: NO_HAPTIC_FEEDBACK,
    hapticsEnabled: false,
    setHapticsEnabled: (_enabled: boolean): void => {},
  }
}
