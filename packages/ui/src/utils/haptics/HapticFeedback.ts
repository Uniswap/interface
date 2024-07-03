// eslint-disable-next-line no-restricted-imports
import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics'

// eslint-disable-next-line no-restricted-imports
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics'

export type HapticFeedbackStyle = ImpactFeedbackStyle | NotificationFeedbackType

export type THapticFeedback = {
  impact: (style?: HapticFeedbackStyle) => Promise<void>
  light: () => Promise<void>
  medium: () => Promise<void>
  heavy: () => Promise<void>
  success: () => Promise<void>
  warning: () => Promise<void>
  error: () => Promise<void>
  selection: () => Promise<void>
}

// Every haptic feedback is a no-op on web.
export const HapticFeedback: THapticFeedback = {
  impact: async (): Promise<void> => Promise.resolve(),
  light: async (): Promise<void> => Promise.resolve(),
  medium: async (): Promise<void> => Promise.resolve(),
  heavy: async (): Promise<void> => Promise.resolve(),
  success: async (): Promise<void> => Promise.resolve(),
  warning: async (): Promise<void> => Promise.resolve(),
  error: async (): Promise<void> => Promise.resolve(),
  selection: async (): Promise<void> => Promise.resolve(),
} as const
