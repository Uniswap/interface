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
  borderRadius: boolean | number
  fontFamily: string
  fontFamilyVariable: string
  fontFamilyCode: string
  tokenColorExtraction: boolean
}

export interface Theme extends Partial<Attributes>, Partial<Colors> {}

export interface ComputedTheme extends Omit<Attributes, 'borderRadius'>, Colors {
  borderRadius: number
  onHover: (color: string) => string
}
