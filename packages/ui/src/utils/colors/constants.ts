import type { LogolessColorScheme } from 'ui/src/utils/colors/types'

export enum LogolessColors {
  PINK = 'PINK',
  ORANGE = 'ORANGE',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  TURQUOISE = 'TURQUOISE',
  CYAN = 'CYAN',
  BLUE = 'BLUE',
  PURPLE = 'PURPLE',
}

type LogolessColorSchemes = {
  [key in LogolessColors]: LogolessColorScheme
}

export const logolessColorSchemes: LogolessColorSchemes = {
  // TODO (MOB-2417): update the colors in the global colors file to these and pull from there
  [LogolessColors.PINK]: {
    light: { foreground: '#FC74FE', background: '#FEF4FF' },
    dark: { foreground: '#FC74FE', background: '#361A37' },
  },
  [LogolessColors.ORANGE]: {
    light: { foreground: '#FF7715', background: '#FFF2F1' },
    dark: { foreground: '#FF7715', background: '#2E0805' },
  },
  [LogolessColors.YELLOW]: {
    light: { foreground: '#FFBF17', background: '#FFFCF2' },
    dark: { foreground: '#FFF612', background: '#1F1E02' },
  },
  [LogolessColors.GREEN]: {
    light: { foreground: '#2FBA61', background: '#EEFBF1' },
    dark: { foreground: '#2FBA61', background: '#0F2C1A' },
  },
  [LogolessColors.TURQUOISE]: {
    light: { foreground: '#00C3A0', background: '#F7FEEB' },
    dark: { foreground: '#5CFE9D', background: '#1A2A21' },
  },
  [LogolessColors.CYAN]: {
    light: { foreground: '#2ABDFF', background: '#EBF8FF' },
    dark: { foreground: '#2ABDFF', background: '#15242B' },
  },
  [LogolessColors.BLUE]: {
    light: { foreground: '#3271FF', background: '#EFF4FF' },
    dark: { foreground: '#3271FF', background: '#10143D' },
  },
  [LogolessColors.PURPLE]: {
    light: { foreground: '#9E62FF', background: '#FAF5FF' },
    dark: { foreground: '#9E62FF', background: '#1A0040' },
  },
}

/*
 The WCAG AA minimum color contrast threshold standard requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text. Large text is defined as 14 point (typically 18.66px) and bold or larger, or 18 point (typically 24px) or larger.
 */
export const MIN_COLOR_CONTRAST_THRESHOLD = 3
