import { BaseSyntheticEvent, PropsWithChildren } from 'react'
import { FlexProps, GeneratedIcon, IconProps, PopperProps, TextProps, TouchableAreaProps } from 'ui/src'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type MenuOptionItem = {
  label: string
  onPress: (e: BaseSyntheticEvent) => void
  textProps?: TextProps
  Icon?: GeneratedIcon | ((props: IconProps) => JSX.Element)
  showDivider?: boolean
  disabled?: boolean
  iconProps?: IconProps
  closeDelay?: number
} & TouchableAreaProps

export type ContextMenuProps = {
  menuItems: MenuOptionItem[]
  menuStyleProps?: FlexProps
  onLeftClick?: boolean
  alignContentLeft?: boolean
  disabled?: boolean
} & PopperProps

export function ContextMenu(_: PropsWithChildren<ContextMenuProps>): JSX.Element {
  throw new PlatformSplitStubError('ContextMenu')
}
