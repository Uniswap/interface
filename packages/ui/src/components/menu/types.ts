import { BaseSyntheticEvent } from 'react'
import { GeneratedIcon, IconProps } from 'ui/src/components/factories/createIcon'
import { TextProps } from 'ui/src/components/text'
import { TouchableAreaProps } from 'ui/src/components/touchable'

export type MenuContentItem = {
  label: string
  onPress: (e: BaseSyntheticEvent) => void
  textProps?: TextProps
  Icon?: GeneratedIcon | ((props: IconProps) => JSX.Element)
  iconProps?: IconProps
  destructive?: boolean
} & TouchableAreaProps
