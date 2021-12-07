export interface Colors {
  // surface
  accent: string
  container: string
  module: string
  interactive: string
  outline: string
  dialog: string

  // text
  primary: string
  secondary: string
  hint: string
  onInteractive: string

  // state
  active: string
  success: string
  warning: string
  error: string

  currentColor: 'currentColor'

  onHover: (color: string) => string
}

export type Color = keyof Omit<Colors, 'onHover'>

export interface Attributes {
  darkMode: boolean
  fontFamily: string
  borderRadius: boolean | 1 | 0
}

export interface Theme extends Record<string, unknown>, Partial<Attributes>, Partial<Colors> {
  light?: Partial<Colors>
  dark?: Partial<Colors>
}

export interface ComputedTheme extends Attributes, Colors, Theme {
  borderRadius: 0 | 1
}
