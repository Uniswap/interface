import { readableColor } from 'polished'
import { PropsWithChildren } from 'react'
import styled, { DefaultTheme } from 'styled-components'

export enum BadgeVariant {
  DEFAULT = 'DEFAULT',
  NEGATIVE = 'NEGATIVE',
  POSITIVE = 'POSITIVE',
  PRIMARY = 'PRIMARY',
  WARNING = 'WARNING',
  PROMOTIONAL = 'PROMOTIONAL',
  BRANDED = 'BRANDED',
  SOFT = 'SOFT',

  WARNING_OUTLINE = 'WARNING_OUTLINE',
}

interface BadgeProps {
  variant?: BadgeVariant
}

function pickBackgroundColor(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.BRANDED:
      return theme.brandedGradient
    case BadgeVariant.PROMOTIONAL:
      return theme.promotionalGradient
    case BadgeVariant.NEGATIVE:
      return theme.critical
    case BadgeVariant.POSITIVE:
      return theme.success
    case BadgeVariant.SOFT:
      return theme.accent2
    case BadgeVariant.PRIMARY:
      return theme.accent1
    case BadgeVariant.WARNING:
      return theme.deprecated_accentWarning
    case BadgeVariant.WARNING_OUTLINE:
      return 'transparent'
    default:
      return theme.surface2
  }
}

function pickBorder(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.WARNING_OUTLINE:
      return `1px solid ${theme.deprecated_accentWarning}`
    default:
      return 'unset'
  }
}

function pickFontColor(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.BRANDED:
      return theme.darkMode ? theme.neutral1 : theme.white
    case BadgeVariant.NEGATIVE:
      return readableColor(theme.critical)
    case BadgeVariant.POSITIVE:
      return readableColor(theme.success)
    case BadgeVariant.SOFT:
      return theme.accent1
    case BadgeVariant.WARNING:
      return readableColor(theme.deprecated_accentWarning)
    case BadgeVariant.WARNING_OUTLINE:
      return theme.deprecated_accentWarning
    default:
      return theme.neutral2
  }
}

const Badge = styled.div<PropsWithChildren<BadgeProps>>`
  align-items: center;
  background: ${({ theme, variant }) => pickBackgroundColor(variant, theme)};
  border: ${({ theme, variant }) => pickBorder(variant, theme)};
  border-radius: 0.5rem;
  color: ${({ theme, variant }) => pickFontColor(variant, theme)};
  display: inline-flex;
  padding: 4px 6px;
  justify-content: center;
  font-weight: 535;
`

export default Badge
