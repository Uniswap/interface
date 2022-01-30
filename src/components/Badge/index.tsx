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
  POSITIVE_OUTLINE = 'POSITIVE_OUTLINE',
  NEGATIVE_OUTLINE = 'NEGATIVE_OUTLINE',
  RED_WHITE = 'RED_WHITE',
  GREY = 'GREY',
  HOLLOW = 'HOLLOW',
  BLUE = 'BLUE'
}

interface BadgeProps {
  variant?: BadgeVariant
}

function pickBackgroundColor(variant: BadgeVariant | undefined, theme: DefaultTheme): Color {
  switch (variant) {
    case BadgeVariant.NEGATIVE:
      return theme.error
    case BadgeVariant.POSITIVE:
      return theme.success
    case BadgeVariant.PRIMARY:
      return theme.primary1
    case BadgeVariant.WARNING:
      return theme.warning
    case BadgeVariant.RED_WHITE:
    case BadgeVariant.POSITIVE_OUTLINE:
    case BadgeVariant.NEGATIVE_OUTLINE:
    case BadgeVariant.WARNING_OUTLINE:
      return 'transparent'
    case BadgeVariant.GREY:
      return '#000';
    case BadgeVariant.HOLLOW:
      return 'transparent'
    case BadgeVariant.BLUE:
      return '#4F4F62'
    default:
      return theme.bg2
  }
}

function pickBorder(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.WARNING_OUTLINE:
      return `1px solid ${theme.primary1}`
    case BadgeVariant.POSITIVE_OUTLINE:
      return `1px solid ${theme.success}`
    case BadgeVariant.RED_WHITE:
    case BadgeVariant.NEGATIVE_OUTLINE:
        return `1px solid ${theme.error}`
    case BadgeVariant.HOLLOW:
      return `1px solid ${theme.white}`
    case BadgeVariant.BLUE:
      return `2px solid #4F4F62`
    default:
      return 'unset'
  }
}

function pickFontColor(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.NEGATIVE:
      return readableColor(theme.error)
      case BadgeVariant.NEGATIVE_OUTLINE:
        return theme.error;
      case BadgeVariant.POSITIVE_OUTLINE: 
      return theme.success;
    case BadgeVariant.POSITIVE:
      return readableColor(theme.success)
    case BadgeVariant.WARNING:
      return readableColor(theme.warning)
    case BadgeVariant.WARNING_OUTLINE:
      return theme.warning
    case BadgeVariant.RED_WHITE:
    case BadgeVariant.GREY:
      return '#FFF';
    case BadgeVariant.HOLLOW:
      return '#FFF';
      case BadgeVariant.BLUE:
        return '#FFF';
      default:
      return readableColor(theme.bg2)
  }
}

function pickFontWeight(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
      case BadgeVariant.BLUE:
        return '600';
    
      default:
      return '500'
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
  font-weight: ${({ theme, variant }) => pickFontWeight(variant, theme)};
  font-family: 'Archivo Narrow';
`

export default Badge
