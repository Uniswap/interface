import * as React from 'react'
// Type-only — react-native runtime imports are banned outside .native legs.
import type { View } from 'react-native'
import { markMyceliumPrimitive } from '../compat/primitive-marker'
import { omitReanimatedPassthroughProps } from '../compat/reanimated-props'
import type { CompatRefProp } from '../compat/web-element'
import type { AnimatedTouchableAreaCompatProps } from './animated-props'
import type { TouchableAreaCompatProps } from './props'
import { TouchableAreaCompat } from './TouchableAreaCompat'

/**
 * Web leg of the `AnimatedTouchableArea` compat: renders the compat
 * TouchableArea and drops the Reanimated-only props — the legacy
 * `withAnimated(TouchableArea)` web leg accepted and ignored them
 * the same way. The `style` widening (animated worklet results) collapses back
 * to the compat style type here: on web a worklet style is a plain object of
 * resolved values.
 */
export const AnimatedTouchableAreaCompat: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<AnimatedTouchableAreaCompatProps> & { ref?: CompatRefProp | undefined }
> = React.forwardRef<HTMLElement | View, AnimatedTouchableAreaCompatProps>(
  function AnimatedTouchableAreaCompat(props, ref) {
    return (
      <TouchableAreaCompat
        ref={ref as React.Ref<HTMLElement>}
        {...(omitReanimatedPassthroughProps(props) as TouchableAreaCompatProps)}
      />
    )
  },
)

AnimatedTouchableAreaCompat.displayName = 'AnimatedTouchableAreaCompat'
markMyceliumPrimitive(AnimatedTouchableAreaCompat)
