import { Insets } from 'react-native'
import Animated from 'react-native-reanimated'
import { SizeTokens, Stack, StackProps, styled } from 'tamagui'

export const flexStyles = {
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
  shrink: { flexShrink: 1 },
}

export type FlexProps = StackProps & {
  row?: boolean
  shrink?: boolean
  grow?: boolean
  fill?: boolean
  centered?: boolean
}

type SizeOrNumber = number | SizeTokens

type SizedInset = {
  top: SizeOrNumber
  left: SizeOrNumber
  right: SizeOrNumber
  bottom: SizeOrNumber
}

const getInset = (val: SizeOrNumber): SizedInset => ({
  top: val,
  right: val,
  bottom: val,
  left: val,
})

export const Flex = styled(Stack, {
  flexDirection: 'column',

  variants: {
    inset: (size: SizeOrNumber | Insets) =>
      size && typeof size === 'object' ? size : getInset(size),

    row: {
      true: {
        flexDirection: 'row',
      },
    },

    shrink: {
      true: {
        flexShrink: 1,
      },
    },

    grow: {
      true: {
        flexGrow: 1,
      },
    },

    fill: {
      true: {
        flex: 1,
      },
    },

    centered: {
      true: {
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
  } as const,
})

/**
 * @deprecated  Prefer <Flex animation="" />
 *
 *    See: https://tamagui.dev/docs/core/animations
 *
 * TODO(MOB-1948): Remove this
 */
export const AnimatedFlex = Animated.createAnimatedComponent(Flex)
AnimatedFlex.displayName = 'AnimatedFlex'
