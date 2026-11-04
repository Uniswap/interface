import type { TextProps, TouchableAreaProps } from '@universe/mycelium'
import type { GeneratedIcon, IconProps } from '@universe/mycelium/icons'
import { BaseSyntheticEvent } from 'react'

export type MenuContentItem = {
  label: string
  onPress: (e: BaseSyntheticEvent) => void
  textProps?: TextProps
  Icon?: GeneratedIcon | ((props: IconProps) => JSX.Element)
  iconProps?: IconProps
  iconPlacement?: 'left' | 'right'
  iconTextGap?: '$spacing16' | '$spacing8'
  destructive?: boolean
} & TouchableAreaProps
