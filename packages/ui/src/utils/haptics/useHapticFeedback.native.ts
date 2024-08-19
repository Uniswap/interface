// eslint-disable-next-line no-restricted-imports
import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync,
  selectionAsync,
} from 'expo-haptics'
import { HapticFeedbackControl, HapticFeedbackStyle, NO_HAPTIC_FEEDBACK } from 'ui/src/utils/haptics/helpers'

// false so that people with haptics disabled don't feel one on any startup case,
// though this should be quickly set on app launch
let hapticsEnabled = false

const ENABLED_HAPTIC_FEEDBACK = {
  impact: async (
    style: ImpactFeedbackStyle | NotificationFeedbackType | undefined = ImpactFeedbackStyle.Light,
  ): Promise<void> => {
    return isImpactFeedbackStyle(style) ? await impactAsync(style) : await notificationAsync(style)
  },
  light: async (): Promise<void> => await impactAsync(ImpactFeedbackStyle.Light),
  medium: async (): Promise<void> => await impactAsync(ImpactFeedbackStyle.Medium),
  heavy: async (): Promise<void> => await impactAsync(ImpactFeedbackStyle.Heavy),
  success: async (): Promise<void> => await notificationAsync(NotificationFeedbackType.Success),
  warning: async (): Promise<void> => await notificationAsync(NotificationFeedbackType.Warning),
  error: async (): Promise<void> => await notificationAsync(NotificationFeedbackType.Error),
  selection: async (): Promise<void> => await selectionAsync(),
}

const setHapticsEnabled = (enabled: boolean): void => {
  hapticsEnabled = enabled
}

export function useHapticFeedback(): HapticFeedbackControl {
  return {
    hapticFeedback: hapticsEnabled ? ENABLED_HAPTIC_FEEDBACK : NO_HAPTIC_FEEDBACK,
    hapticsEnabled,
    setHapticsEnabled,
  }
}

function isImpactFeedbackStyle(style: HapticFeedbackStyle): style is ImpactFeedbackStyle {
  return Object.values(ImpactFeedbackStyle).includes(style as ImpactFeedbackStyle)
}
