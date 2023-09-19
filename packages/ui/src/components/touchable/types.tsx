import { ImpactFeedbackStyle } from 'expo-haptics'
import { TouchableBoxProps } from 'ui/src/components/touchable/TouchableBox'

export type TouchableAreaProps = TouchableBoxProps & {
  hapticFeedback?: boolean
  hapticStyle?: ImpactFeedbackStyle
  scaleTo?: number
}
