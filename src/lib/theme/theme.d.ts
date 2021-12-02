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
}

export type Color = keyof Omit<Colors, 'onHover'>

export interface Attributes {
  darkMode: boolean
  fontFamily: string
  borderRadius: number // em
  onHover: (color: string) => string
}

export interface Theme extends Record<string, unknown>, Attributes, Colors {
  light: Colors
  dark: Colors
}
