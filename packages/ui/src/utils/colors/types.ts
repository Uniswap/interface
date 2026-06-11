import type { ColorTokens } from 'tamagui'

export type TamaguiColor =
  | ColorTokens
  | 'transparent'
  | `rgba(${string})`
  | `rgb(${string})`
  | `hsl(${string})`
  | `hsla(${string})`
  | `#${string}`

export type ColorStrategy = 'vibrant' | 'muted'

export type ExtractedColors = {
  primary?: string
  secondary?: string
  base?: string
  detail?: string
}

export type LogolessColorScheme = {
  light: { foreground: TamaguiColor; background: TamaguiColor }
  dark: { foreground: TamaguiColor; background: TamaguiColor }
}
