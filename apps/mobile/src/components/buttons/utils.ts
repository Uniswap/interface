import { WithSpringConfig, withSequence, withSpring } from 'react-native-reanimated'

export function pulseAnimation(
  activeScale: number,
  spingAnimationConfig: WithSpringConfig = { damping: 1, stiffness: 200 },
): number {
  'worklet'
  return withSequence(withSpring(activeScale, spingAnimationConfig), withSpring(1, spingAnimationConfig))
}
