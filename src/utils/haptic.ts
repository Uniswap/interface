import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'

/** Simple wrapper around impactAsync to avoid anonymous functions which can hurt performance */
export const invokeImpact = {
  [ImpactFeedbackStyle.Light]: (): void => {
    impactAsync(ImpactFeedbackStyle.Light)
  },
  [ImpactFeedbackStyle.Medium]: (): void => {
    impactAsync(ImpactFeedbackStyle.Medium)
  },
  [ImpactFeedbackStyle.Heavy]: (): void => {
    impactAsync(ImpactFeedbackStyle.Heavy)
  },
} as const
