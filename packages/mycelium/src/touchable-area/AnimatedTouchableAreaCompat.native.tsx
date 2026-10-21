import Animated from 'react-native-reanimated'
import type { FirstOverloadReturn } from '../compat/first-overload-return'
import { TouchableAreaCompat } from './TouchableAreaCompat'

/**
 * Native leg of the `AnimatedTouchableArea` compat: a REAL Reanimated wrapper
 * over the compat TouchableArea (never a stub), replacing the legacy
 * `withAnimated(TouchableArea)` (`components/factories/animated.native.tsx`
 * via `TouchableArea.tsx:425-428`). The compat TouchableArea native leg is a
 * forwardRef to a real RN `View` host, so `createAnimatedComponent` wraps it
 * directly — no class shim needed (the same shape as the AnimatedFlex compat
 * and mycelium's own `createIcon.native.tsx` animated twin).
 */
// Explicit annotation: the inferred AnimatedComponentType names
// mycelium-internal prop types the touchable-area subpath does not export
// (TS2883 under declaration emit); the instantiation expression keeps the
// exact same type. FirstOverloadReturn targets the overload ReturnType<>
// stopped resolving in reanimated 4.5 — rationale in
// ../compat/first-overload-return.
export const AnimatedTouchableAreaCompat: FirstOverloadReturn<
  typeof Animated.createAnimatedComponent<typeof TouchableAreaCompat>
> = Animated.createAnimatedComponent(TouchableAreaCompat)

// Reanimated v4 returns a function-style AnimatedComponentType that doesn't
// expose `displayName` on the type. Cast through unknown to assign for
// devtools labeling.
;(AnimatedTouchableAreaCompat as unknown as { displayName?: string }).displayName = 'AnimatedTouchableAreaCompat'
