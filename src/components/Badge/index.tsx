import { readableColor } from 'polished'
import { PropsWithChildren } from 'react'
import styled, { DefaultTheme } from 'styled-components/macro'
import { Color } from 'theme/styled'

export enum BadgeVariant {
  DEFAULT = 'DEFAULT',
  NEGATIVE = 'NEGATIVE',
  POSITIVE = 'POSITIVE',
  PRIMARY = 'PRIMARY',
  WARNING = 'WARNING',

  WARNING_OUTLINE = 'WARNING_OUTLINE',
}

interface BadgeProps {
  variant?: BadgeVariant
}

function pickBackgroundColor(variant: BadgeVariant | undefined, theme: DefaultTheme): Color {
  switch (variant) {
    case BadgeVariant.NEGATIVE:
      return theme.deprecated_error
    case BadgeVariant.POSITIVE:
      return theme.deprecated_success
    case BadgeVariant.PRIMARY:
      return theme.deprecated_primary1
    case BadgeVariant.WARNING:
      return theme.deprecated_warning
    case BadgeVariant.WARNING_OUTLINE:
      return 'transparent'
    default:
      return theme.deprecated_bg2
  }
}

function pickBorder(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.WARNING_OUTLINE:
      return `1px solid ${theme.deprecated_warning}`
    default:
      return 'unset'
  }
}

function pickFontColor(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.NEGATIVE:
      return readableColor(theme.deprecated_error)
    case BadgeVariant.POSITIVE:
      return readableColor(theme.deprecated_success)
    case BadgeVariant.WARNING:
      return readableColor(theme.deprecated_warning)
    case BadgeVariant.WARNING_OUTLINE:
      return theme.deprecated_warning
    default:
      return readableColor(theme.deprecated_bg2)
  }
}

const Badge = styled.div<PropsWithChildren<BadgeProps>>`
  align-items: center;
  background-color: ${({ theme, variant }) => pickBackgroundColor(variant, theme)};
  border: ${({ theme, variant }) => pickBorder(variant, theme)};
  border-radius: 0.5rem;
  color: ${({ theme, variant }) => pickFontColor(variant, theme)};
  display: inline-flex;
  padding: 4px 6px;
  justify-content: center;
  font-weight: 500;
`

export default Badge
