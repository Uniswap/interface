export type Color = string

export interface Colors {
  white: Color
  black: Color

  text: Color
  icon: Color
  action: Color
  selected: Color

  bg: Color
  modalBg: Color
  alertBg: Color

  confirm: Color
  success: Color
  error: Color
}

export interface Theme extends Colors {
  // opacity for accent UI (labels, details, etc)
  accentOpacity: number

  font: string
  borderRadius: number
}
