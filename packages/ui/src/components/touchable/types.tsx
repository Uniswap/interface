import { ImpactFeedbackStyle } from 'expo-haptics'
import { Insets } from 'react-native'
import { StackProps } from 'tamagui'

type ExtraProps = {
  hitSlop?: Insets | number
  activeOpacity?: number
  hapticFeedback?: boolean
  hapticStyle?: ImpactFeedbackStyle
  ignoreDragEvents?: boolean
  scaleTo?: number
  disabled?: boolean
  hoverable?: boolean
}

export type TouchableAreaProps = Omit<StackProps, keyof ExtraProps> & ExtraProps
