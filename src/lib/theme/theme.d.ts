import { toColorString } from 'polished'

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
  contrast: Color // white or black

  // state
  active: Color
  success: Color
  warning: Color
  error: Color
}

export interface Attributes {
  darkMode: boolean
  fontFamily: string
  borderRadius: number // em
}

export interface Theme extends Colors, Attributes {
  light: Colors
  dark: Colors
}
