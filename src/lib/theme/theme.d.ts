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
}

export type Color = keyof Colors

export interface Attributes {
  fontFamily: string
  borderRadius: boolean | 0 | 1
}

export interface Theme extends Partial<Attributes>, Partial<Colors> {}

export interface ComputedTheme extends Omit<Attributes, 'borderRadius'>, Colors {
  borderRadius: 0 | 1
  onHover: (color: string) => string
}
