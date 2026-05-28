import type { TextProps } from 'ui/src'

export type HeaderActionDropdownItem = {
  title: string
  textColor?: TextProps['color']
  icon: React.ReactNode
  onPress: () => void
  show?: boolean
  href?: string
  subtitle?: string
  trailingIcon?: React.ReactNode
}

type HeaderActionBase = {
  title: string
  textColor?: TextProps['color']
  icon: React.ReactNode
  show: boolean
  href?: string
  subtitle?: string
  trailingIcon?: React.ReactNode
}

type HeaderActionSimple = HeaderActionBase & {
  onPress: () => void
  dropdownItems?: never
}

export type HeaderActionWithDropdown = HeaderActionBase & {
  onPress?: never
  dropdownItems: HeaderActionDropdownItem[]
}

export type HeaderAction = HeaderActionSimple | HeaderActionWithDropdown

export function isHeaderActionWithDropdown(action: HeaderAction): action is HeaderActionWithDropdown {
  return 'dropdownItems' in action && Array.isArray(action.dropdownItems) && action.dropdownItems.length > 0
}

export type HeaderActionSection = {
  title: string
  actions: HeaderAction[]
}
