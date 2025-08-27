import { ColorTokens } from 'tamagui'

export function getMenuItemColor<T>({
  overrideColor,
  destructive,
  disabled,
}: {
  overrideColor?: T
  destructive?: boolean
  disabled?: boolean
}): T | ColorTokens {
  if (overrideColor) {
    return overrideColor
  }

  if (destructive) {
    return '$statusCritical'
  }

  if (disabled) {
    return '$neutral2'
  }

  return '$neutral1'
}
