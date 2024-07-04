import type { Insets } from 'react-native'
import { SizeTokens, View, ViewProps, styled } from 'tamagui'
import { animationsEnter, animationsEnterExit, animationsExit } from 'ui/src/animations/animationPresets'

export const flexStyles = {
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
  shrink: { flexShrink: 1 },
}

export type FlexProps = ViewProps & {
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

export const Flex = styled(View, {
  flexDirection: 'column',

  variants: {
    inset: (size: SizeOrNumber | Insets) => (size && typeof size === 'object' ? size : getInset(size)),

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

    animateEnter: animationsEnter,
    animateExit: animationsExit,
    animateEnterExit: animationsEnterExit,
  } as const,
})
