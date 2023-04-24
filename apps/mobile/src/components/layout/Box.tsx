import { createBox } from '@shopify/restyle'
import { ComponentProps } from 'react'
import Animated from 'react-native-reanimated'
import { Theme } from 'src/styles/theme'

export type BoxProps = ComponentProps<typeof Box>
export const Box = createBox<Theme>()
export const AnimatedBox = Animated.createAnimatedComponent(Box)
