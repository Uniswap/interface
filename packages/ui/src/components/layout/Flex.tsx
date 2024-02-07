import Animated from 'react-native-reanimated'
import { Stack, StackProps, styled } from 'tamagui'

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

export const Flex = styled(Stack, {
  flexDirection: 'column',

  variants: {
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

export const AnimatedFlex = Animated.createAnimatedComponent(Flex)
AnimatedFlex.displayName = 'AnimatedFlex'
