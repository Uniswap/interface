import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { GetProps, Stack } from 'tamagui'
import { withAnimated } from 'ui/src/components/factories/animated'

export const TouchableBox = TouchableOpacity

export const AnimatedTouchableBox = withAnimated(TouchableBox)

export type TouchableBoxProps = GetProps<typeof Stack> & TouchableOpacityProps
