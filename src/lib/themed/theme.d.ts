export type Color = string

export interface Colors {
  // text
  text1: Color
  text2: Color

  // icons
  icon1: Color
  icon2: Color

  // backgrounds
  bg1: Color
  bg2: Color
  bg3: Color

  // statuses
  confirm: Color
  success: Color
  warning: Color
  error: Color
}

export interface Theme extends Colors {
  font: string
  borderRadius: number
}
