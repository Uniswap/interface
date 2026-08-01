import { Pressable } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { styled, type YStackProps } from 'tamagui'
import { withCommonPressStyle } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/utils'

type TouchableAreaVariant = 'unstyled' | 'none' | 'outlined' | 'filled' | 'raised' | 'floating'

type PropsWithHoverableAndDisabled = {
  props: {
    hoverable?: boolean
    disabled?: boolean
  }
}

// Wrap RNGH Pressable with createAnimatedComponent so Reanimated 4 strict mode recognises this
// component as a valid animated target. Without it, `AnimatedTouchableArea = withAnimated(TouchableArea)`
// passes a worklet style down through Tamagui's `styled` wrapper into a non-animated host and throws.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Native build uses RNGH's Pressable as the base so press hit-testing reads from the native view
// hierarchy. Tamagui's measure-based press detection on YStack reads from the JS shadow tree,
// which goes stale under continuous Reanimated animations on Android Fabric (RN #51621).
export const TouchableAreaFrame = styled(AnimatedPressable, {
  name: 'TouchableArea',
  pressStyle: withCommonPressStyle({}),
  borderRadius: '$rounded12',
  backgroundColor: '$transparent',
  variants: {
    centered: {
      true: {
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    row: {
      true: {
        flexDirection: 'row',
      },
      false: {
        flexDirection: 'column',
      },
    },
    disabled: {
      true: {
        'aria-disabled': true,
        opacity: 0.6,
      },
      false: {},
    },
    hoverable: {
      true: {},
      false: {},
    },
    variant: {
      unstyled: {
        pressStyle: {
          scale: 1,
        },
      },
      none: {},
      outlined: {
        borderWidth: 1,
        borderColor: '$surface3',
      },
      filled: {
        backgroundColor: '$surface3',
      },
      raised: (_: unknown, { props: { disabled } }: PropsWithHoverableAndDisabled): Partial<YStackProps> => ({
        shadowOffset: disabled ? undefined : { width: 0, height: 1 },
        shadowOpacity: disabled ? undefined : 0.1,
        shadowRadius: disabled ? undefined : 3,
        shadowColor: disabled ? undefined : '$black',
        elevation: disabled ? undefined : 1,
        borderWidth: 1,
        borderColor: '$surface3',
        backgroundColor: disabled ? '$surface2' : undefined,
      }),
      floating: {
        backgroundColor: '$surface5',
      },
    } as Record<NonNullable<TouchableAreaVariant>, Partial<YStackProps>>,
  } as const,
  defaultVariants: {
    variant: 'none',
    centered: false,
    hoverable: true,
    row: false,
  },
})

TouchableAreaFrame.displayName = 'TouchableAreaFrame'
