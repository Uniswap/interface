import type { THapticFeedback } from 'ui/src/utils/haptics/HapticFeedback'

// eslint-disable-next-line no-restricted-imports
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics'

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
