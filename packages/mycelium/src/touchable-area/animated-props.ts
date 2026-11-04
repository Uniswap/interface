// Type-only — react-native runtime imports are banned outside .native legs.
import type { StyleProp, ViewStyle } from 'react-native'
import type { ReanimatedPassthroughProps } from '../compat/reanimated-props'
import type { TouchableAreaCompatProps } from './props'

/**
 * The `AnimatedTouchableArea` compat prop contract: the compat TouchableArea
 * surface with the Reanimated channels the legacy `withAnimated(TouchableArea)`
 * wrapper carried (its `AnimateProps`,
 * plus the legacy export's own `style` widening —
 * `components/touchable/TouchableArea/TouchableArea.tsx:427`). On web the
 * Reanimated props are accepted for cross-platform call sites and ignored.
 */
export type AnimatedTouchableAreaCompatProps = Omit<TouchableAreaCompatProps, 'style'> &
  ReanimatedPassthroughProps & {
    /**
     * Regular styles or a `useAnimatedStyle` worklet result. Reanimated's
     * animated-style types don't compose with the compat style type (the legacy
     * surface typed this `any`); `object` admits every animated style while
     * still rejecting scalars.
     */
    style?: StyleProp<ViewStyle> | object
  }
