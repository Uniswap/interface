import { PropsWithChildren } from 'react'
import { GeneratedIcon, IconProps, TextProps } from 'ui/src'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type MenuOptionItem = {
  label: string
  onPress: () => void
  Icon?: GeneratedIcon | ((props: IconProps) => JSX.Element)
  showDivider?: boolean
  disabled?: boolean
  iconColor?: IconProps['color']
  textColor?: TextProps['color']
  closeDelay?: number
}

/**
 * Props for the ContextMenu component
 * @property menuItems - the menu options
 * @property isPlacementAbove / isPlacementRight - where the menu should be aligned relative to the trigger. By default,the menu is aligned to the bottom left of the trigger.
 * @property offsetX / offsetY - the offset of the menu from the trigger. By default, these are set to 0.
 * @property onPressAny - called when any menu option is pressed. will not be called if the onPress prop of the action throws
 * @property triggerMode - How the menu is triggered - primary (left click/tap) or secondary (right click/long press)
 * @property disabled
 * @property isOpen
 * @property closeMenu
 * @property openMenu - required if child component does not control menu state. leave undefined if the child component trigger opens the menu
 */
export type ContextMenuProps = {
  menuItems: MenuOptionItem[]
  isPlacementAbove?: boolean
  isPlacementRight?: boolean
  offsetX?: number
  offsetY?: number
  onPressAny?: (e: { name: string; index: number; indexPath: number[] }) => void
  triggerMode: ContextMenuTriggerMode
  disabled?: boolean
  isOpen: boolean
  closeMenu: () => void
  openMenu?: () => void
}

export function ContextMenu(_: PropsWithChildren<ContextMenuProps>): JSX.Element {
  throw new PlatformSplitStubError('ContextMenu')
}
