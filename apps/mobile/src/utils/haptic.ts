import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'

/** Simple wrapper around impactAsync to avoid anonymous functions which can hurt performance */
export const invokeImpact = {
  [ImpactFeedbackStyle.Light]: async (): Promise<void> => {
    await impactAsync(ImpactFeedbackStyle.Light)
  },
  [ImpactFeedbackStyle.Medium]: async (): Promise<void> => {
    await impactAsync(ImpactFeedbackStyle.Medium)
  },
  [ImpactFeedbackStyle.Heavy]: async (): Promise<void> => {
    await impactAsync(ImpactFeedbackStyle.Heavy)
  },
} as const
