import { createBox } from '@shopify/restyle'
import Animated from 'react-native-reanimated'
import { Theme } from 'src/styles/theme'

export const Box = createBox<Theme>()
export const AnimatedBox = createBox<Theme>(Animated.View)
