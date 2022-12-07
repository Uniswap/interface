import { readableColor } from 'polished'
import { PropsWithChildren } from 'react'
import styled, { DefaultTheme } from 'styled-components/macro'

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
      return theme.accentCritical
    case BadgeVariant.POSITIVE:
      return theme.accentSuccess
    case BadgeVariant.SOFT:
      return theme.accentActionSoft
    case BadgeVariant.PRIMARY:
      return theme.deprecated_primary1
    case BadgeVariant.WARNING:
      return theme.accentWarning
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
    case BadgeVariant.BRANDED:
      return theme.accentTextDarkPrimary
    case BadgeVariant.NEGATIVE:
      return readableColor(theme.deprecated_error)
    case BadgeVariant.POSITIVE:
      return readableColor(theme.deprecated_success)
    case BadgeVariant.SOFT:
      return theme.accentAction
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
  background: ${({ theme, variant }) => pickBackgroundColor(variant, theme)};
  border: ${({ theme, variant }) => pickBorder(variant, theme)};
  border-radius: 0.5rem;
  color: ${({ theme, variant }) => pickFontColor(variant, theme)};
  display: inline-flex;
  padding: 4px 6px;
  justify-content: center;
  font-weight: 500;
`

export default Badge

export const SmallBadge = styled(Badge)`
  border-radius: 5px;
  padding: 2px 4px;
`
