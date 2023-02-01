import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'

/** Simple wrapper around impactAsync to avoid anonymous functions which can hurt performance */
export const invokeImpact = {
  [ImpactFeedbackStyle.Light]: () => impactAsync(ImpactFeedbackStyle.Light),
  [ImpactFeedbackStyle.Medium]: () => impactAsync(ImpactFeedbackStyle.Medium),
  [ImpactFeedbackStyle.Heavy]: () => impactAsync(ImpactFeedbackStyle.Heavy),
} as const
