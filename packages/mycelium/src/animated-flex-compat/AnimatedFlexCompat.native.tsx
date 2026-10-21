import Animated from 'react-native-reanimated'
import type { FirstOverloadReturn } from '../compat/first-overload-return'
import { FlexCompat } from '../flex-compat/FlexCompat'

/**
 * Native leg: a real Reanimated wrapper over the compat Flex, ported from ui's AnimatedFlex.native.
 * The base View forwards ref/onLayout and allow-lists collapsable/nativeID — the props Reanimated injects.
 */
// Explicit annotation: the inferred AnimatedComponentType names
// mycelium-internal prop types the animated-flex-compat subpath does not
// export (TS2883 under declaration emit); the instantiation expression keeps
// the exact same type. Same shape as the legacy native leg.
// FirstOverloadReturn targets the overload ReturnType<> stopped resolving in
// reanimated 4.5 — rationale in ../compat/first-overload-return.
export const AnimatedFlexCompat: FirstOverloadReturn<typeof Animated.createAnimatedComponent<typeof FlexCompat>> =
  Animated.createAnimatedComponent(FlexCompat)

// Reanimated v4 returns a function-style AnimatedComponentType that doesn't
// expose `displayName` on the type. Cast through unknown to assign for
// devtools labeling — the legacy native leg's exact idiom.
;(AnimatedFlexCompat as unknown as { displayName?: string }).displayName = 'AnimatedFlexCompat'
