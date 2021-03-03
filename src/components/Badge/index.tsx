import { readableColor } from 'polished'
import { PropsWithChildren } from 'react'
import styled, { DefaultTheme } from 'styled-components'
import { Color } from 'theme/styled'

export enum BadgeVariant {
  DEFAULT = 'DEFAULT',
  NEGATIVE = 'NEGATIVE',
  POSITIVE = 'POSITIVE',
  WARNING = 'WARNING',
  WARNING_OUTLINE = 'WARNING_OUTLINE',
}

export interface BadgeProps {
  variant?: BadgeVariant
}

function pickBackgroundColor(variant: BadgeVariant | undefined, theme: DefaultTheme): Color {
  switch (variant) {
    case BadgeVariant.NEGATIVE:
      return theme.error
    case BadgeVariant.POSITIVE:
      return theme.success
    case BadgeVariant.WARNING:
      return theme.warning
    case BadgeVariant.WARNING_OUTLINE:
      return 'transparent'
    default:
      return theme.bg3
  }
}

function pickBorder(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.WARNING_OUTLINE:
      return `2px solid ${theme.warning}`
    default:
      return 'unset'
  }
}

function pickFontColor(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.NEGATIVE:
      return readableColor(theme.error)
    case BadgeVariant.POSITIVE:
      return readableColor(theme.success)
    case BadgeVariant.WARNING:
      return readableColor(theme.warning)
    case BadgeVariant.WARNING_OUTLINE:
      return theme.warning
    default:
      return readableColor(theme.bg3)
  }
}

const Badge = styled.div<PropsWithChildren<BadgeProps>>`
  align-items: center;
  background-color: ${({ theme, variant }) => pickBackgroundColor(variant, theme)};
  border: ${({ theme, variant }) => pickBorder(variant, theme)};
  border-radius: 0.5em;
  color: ${({ theme, variant }) => pickFontColor(variant, theme)};
  display: inline-flex;
  padding: 2px 6px;
  justify-content: center;
`

export default Badge
