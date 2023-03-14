// Tamagui syntax for defining sub-themes

import { createTheme } from '@tamagui/core'
import { colorsDark, colorsLight } from './color'

// TODO: use tokens.color instead of colorsLight/Dark
const light = createTheme({
  // Uniswap Design System
  ...colorsLight,

  // Tamagui Theme
  // Tamagui components expect the following
  background: colorsLight.background0,
  backgroundHover: colorsLight.background1,
  backgroundPress: colorsLight.background1,
  backgroundFocus: colorsLight.background1,
  borderColor: colorsLight.none,
  borderColorHover: colorsLight.none,
  color: colorsLight.textPrimary,
  colorHover: colorsLight.userThemeMagenta,
  colorPress: colorsLight.userThemeMagenta,
  colorFocus: colorsLight.userThemeMagenta,
  shadowColor: colorsLight.none,
  shadowColorHover: colorsLight.none,
})
type BaseTheme = typeof light

const dark: BaseTheme = {
  ...colorsDark,
  ...light,
  //   background: '#000',
  //   backgroundHover: tokens.color.gray2Dark,
  //   backgroundPress: tokens.color.gray3Dark,
  //   backgroundFocus: tokens.color.gray4Dark,
  //   borderColor: tokens.color.gray3Dark,
  //   borderColorHover: tokens.color.gray4Dark,
  //   color: '#ddd',
  //   colorHover: tokens.color.gray11Dark,
  //   colorPress: tokens.color.gray10Dark,
  //   colorFocus: tokens.color.gray6Dark,
  //   shadowColor: tokens.color.grayA6,
  //   shadowColorHover: tokens.color.grayA7,
}

// if you need to add non-token values, use createTheme
// const dark_translucent: ButtonTheme = createTheme({
//     ...dark_Button,
//     background: 'rgba(0,0,0,0.7)',
//     backgroundHover: 'rgba(0,0,0,0.5)',
//     backgroundPress: 'rgba(0,0,0,0.25)',
//     backgroundFocus: 'rgba(0,0,0,0.1)',
// })

// const light_translucent: ButtonTheme = createTheme({
//     ...light_Button,
//     background: 'rgba(255,255,255,0.85)',
//     backgroundHover: 'rgba(250,250,250,0.85)',
//     backgroundPress: 'rgba(240,240,240,0.85)',
//     backgroundFocus: 'rgba(240,240,240,0.7)',
// })

const light_secondary: BaseTheme = {
  ...light,
  color: colorsLight.textSecondary,
}
const dark_secondary: BaseTheme = {
  ...dark,
  color: colorsDark.textSecondary,
}

// combine and narrow theme types before exporting
const allThemes = {
  dark,
  light,
  light_secondary,
  dark_secondary,
}

type ThemeName = keyof typeof allThemes
type Themes = {
  [key in ThemeName]: BaseTheme
}

export const themes: Themes = allThemes
