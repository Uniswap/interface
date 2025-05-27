import type { Insets } from 'react-native'
import { YStackProps } from 'tamagui'

type ExtraProps = {
  hitSlop?: Insets | number
  activeOpacity?: number
  ignoreDragEvents?: boolean
  scaleTo?: number
  disabled?: boolean
  hoverable?: boolean
}

export type TouchableAreaProps = Omit<YStackProps, keyof ExtraProps> & ExtraProps
