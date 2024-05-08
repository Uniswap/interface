// eslint-disable-next-line no-restricted-imports
import { impactAsync, notificationAsync, selectionAsync } from 'expo-haptics'
import {
  HapticFeedbackStyle,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  THapticFeedback,
} from 'ui/src/utils/haptics/HapticFeedback'

// eslint-disable-next-line no-restricted-imports
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics'

function isImpactFeedbackStyle(style: HapticFeedbackStyle): style is ImpactFeedbackStyle {
  return Object.values(ImpactFeedbackStyle).includes(style as ImpactFeedbackStyle)
}

export const HapticFeedback: THapticFeedback = {
  impact: async (
    style: ImpactFeedbackStyle | NotificationFeedbackType | undefined = ImpactFeedbackStyle.Light
  ): Promise<void> => {
    return isImpactFeedbackStyle(style) ? await impactAsync(style) : await notificationAsync(style)
  },
  light: async (): Promise<void> => {
    await impactAsync(ImpactFeedbackStyle.Light)
  },
  medium: async (): Promise<void> => {
    await impactAsync(ImpactFeedbackStyle.Medium)
  },
  heavy: async (): Promise<void> => {
    await impactAsync(ImpactFeedbackStyle.Heavy)
  },
  success: async (): Promise<void> => {
    await notificationAsync(NotificationFeedbackType.Success)
  },
  warning: async (): Promise<void> => {
    await notificationAsync(NotificationFeedbackType.Warning)
  },
  error: async (): Promise<void> => {
    await notificationAsync(NotificationFeedbackType.Error)
  },
  selection: async (): Promise<void> => {
    await selectionAsync()
  },
} as const
