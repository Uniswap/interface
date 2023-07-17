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
      return theme.accentAction
    case BadgeVariant.WARNING:
      return theme.accentWarning
    case BadgeVariant.WARNING_OUTLINE:
      return 'transparent'
    default:
      return theme.backgroundInteractive
  }
}

function pickBorder(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.WARNING_OUTLINE:
      return `1px solid ${theme.accentWarning}`
    default:
      return 'unset'
  }
}

function pickFontColor(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.BRANDED:
      return theme.darkMode ? theme.accentTextDarkPrimary : theme.white
    case BadgeVariant.NEGATIVE:
      return readableColor(theme.accentFailure)
    case BadgeVariant.POSITIVE:
      return readableColor(theme.accentSuccess)
    case BadgeVariant.SOFT:
      return theme.accentAction
    case BadgeVariant.WARNING:
      return readableColor(theme.accentWarning)
    case BadgeVariant.WARNING_OUTLINE:
      return theme.accentWarning
    default:
      return readableColor(theme.backgroundInteractive)
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
