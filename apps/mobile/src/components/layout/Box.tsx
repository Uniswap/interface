import { createBox } from '@shopify/restyle'
import { ComponentProps } from 'react'
import Animated from 'react-native-reanimated'
import { Theme } from 'ui/src/theme/restyle'

export type BoxProps = ComponentProps<typeof Box>
export const Box = createBox<Theme>()
export const AnimatedBox = Animated.createAnimatedComponent(Box)
