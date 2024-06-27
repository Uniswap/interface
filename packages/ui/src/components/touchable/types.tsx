import { Insets } from 'react-native'
import { StackProps } from 'tamagui'
import { HapticFeedbackStyle } from 'ui/src/utils/haptics/HapticFeedback'

type ExtraProps = {
  hitSlop?: Insets | number
  activeOpacity?: number
  hapticFeedback?: boolean
  hapticStyle?: HapticFeedbackStyle
  ignoreDragEvents?: boolean
  scaleTo?: number
  disabled?: boolean
  hoverable?: boolean
}

export type TouchableAreaProps = Omit<StackProps, keyof ExtraProps> & ExtraProps
