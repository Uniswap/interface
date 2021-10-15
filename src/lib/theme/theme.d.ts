export type Color = string

export interface Colors {
  // surface
  accent: Color
  container: Color
  module: Color
  interactive: Color
  outline: Color
  dialog: Color

  // text
  primary: Color
  secondary: Color
  hint: Color

  // state
  active: Color
  success: Color
  warning: Color
  error: Color
}

export interface Theme extends Colors {
  fontFamily: string
  borderRadius: number // em
}
