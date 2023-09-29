import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { GetProps, Stack } from 'tamagui'
import { withAnimated } from 'ui/src/components/factories/animated'

export const TouchableBox = TouchableOpacity

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AnimatedTouchableBox = withAnimated(TouchableBox) as any

export type TouchableBoxProps = GetProps<typeof Stack> & TouchableOpacityProps
