// Tamagui syntax for defining sub-themes

import { createTheme } from 'tamagui'
import { tamaguiDark as colorsDark, tamaguiLight as colorsLight } from 'ui/src/theme/color'
import { opacify } from 'ui/src/theme/color/utils'

// TODO: systematize hover and focus states. requires consolidating mobile and web design systems (they have different button styles right now)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hoverColor = (color: any): string => opacify(85, color)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pressedColor = (color: any): string => opacify(65, color)

// TODO: use tokens.color instead of colorsLight/Dark
const light = createTheme({
  // Uniswap Design System
  ...colorsLight,

  // Tamagui Theme
  // Tamagui components expect the following
  background: colorsLight.DEP_background0,
  backgroundHover: colorsLight.DEP_background1,
  backgroundPress: colorsLight.DEP_background1,
  backgroundFocus: colorsLight.DEP_background1,
  borderColor: colorsLight.none,
  borderColorHover: colorsLight.none,
  color: colorsLight.DEP_textPrimary,
  colorHover: colorsLight.DEP_magentaVibrant,
  colorPress: colorsLight.DEP_magentaVibrant,
  colorFocus: colorsLight.DEP_magentaVibrant,
  shadowColor: colorsLight.none,
  shadowColorHover: colorsLight.none,
})
type BaseTheme = typeof light

const dark: BaseTheme = {
  ...light,
  ...colorsDark,
  background: colorsDark.DEP_background0,
  backgroundHover: colorsDark.DEP_background1,
  backgroundPress: colorsDark.DEP_background1,
  backgroundFocus: colorsDark.DEP_background1,
  borderColor: colorsDark.none,
  borderColorHover: colorsDark.none,
  color: colorsDark.DEP_textPrimary,
  colorHover: colorsDark.DEP_magentaVibrant,
  colorPress: colorsDark.DEP_magentaVibrant,
  colorFocus: colorsDark.DEP_magentaVibrant,
  shadowColor: colorsDark.none,
  shadowColorHover: colorsDark.none,
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

const light_branded: BaseTheme = {
  ...light,
  color: colorsLight.DEP_magentaVibrant,
}
const dark_branded: BaseTheme = {
  ...dark,
  color: colorsDark.DEP_magentaVibrant,
}
const light_primary: BaseTheme = {
  ...light,
}
const dark_primary: BaseTheme = {
  ...dark,
}
const light_secondary: BaseTheme = {
  ...light,
}
const dark_secondary: BaseTheme = {
  ...dark,
  color: colorsDark.DEP_textSecondary,
}
const light_tertiary: BaseTheme = {
  ...light,
}
const dark_tertiary: BaseTheme = {
  ...dark,
}
const light_detrimental: BaseTheme = {
  ...light,
}
const dark_detrimental: BaseTheme = {
  ...dark,
}
const light_warning: BaseTheme = {
  ...light,
}
const dark_warning: BaseTheme = {
  ...dark,
}

// Button
// primary
// theme: light
const light_primary_Button: BaseTheme = {
  ...light,
  background: colorsLight.DEP_magentaVibrant,
  backgroundHover: hoverColor(colorsLight.DEP_magentaVibrant),
  backgroundPress: pressedColor(colorsLight.DEP_magentaVibrant),
  color: colorsLight.DEP_white,
}

// theme: dark
const dark_primary_Button: BaseTheme = {
  ...dark,
  background: colorsDark.DEP_magentaVibrant,
  backgroundHover: hoverColor(colorsDark.DEP_magentaVibrant),
  backgroundPress: pressedColor(colorsDark.DEP_magentaVibrant),
  color: colorsDark.DEP_white,
}

// secondary
// theme: light
const light_secondary_Button: BaseTheme = {
  ...light,
  background: colorsLight.DEP_background3,
  backgroundHover: hoverColor(colorsLight.DEP_background3),
  backgroundPress: pressedColor(colorsLight.DEP_background3),
  color: colorsLight.DEP_textOnDimPrimary,
}

// theme: dark
const dark_secondary_Button: BaseTheme = {
  ...dark,
  background: colorsDark.DEP_background3,
  backgroundHover: hoverColor(colorsDark.DEP_background3),
  backgroundPress: pressedColor(colorsDark.DEP_background3),
  color: colorsDark.DEP_textOnBrightPrimary,
}

// tertiary
// theme: light
const light_tertiary_Button: BaseTheme = {
  ...light,
  background: colorsLight.none,
  backgroundHover: colorsLight.none,
  backgroundPress: colorsLight.none,
  borderColor: colorsLight.DEP_backgroundOutline,
  color: colorsLight.DEP_textOnBrightPrimary,
}

// theme: dark
const dark_tertiary_Button: BaseTheme = {
  ...dark,
  background: colorsDark.none,
  backgroundHover: colorsDark.none,
  backgroundPress: colorsDark.none,
  borderColor: colorsDark.DEP_backgroundOutline,
  color: colorsDark.DEP_textOnBrightPrimary,
}

// detrimental
// theme: light
const light_detrimental_Button: BaseTheme = {
  ...light,
  background: colorsLight.DEP_accentCriticalSoft,
  backgroundHover: colorsLight.DEP_accentCriticalSoft,
  backgroundPress: colorsLight.DEP_accentCriticalSoft,
  color: colorsLight.DEP_accentCritical,
}

// theme: dark
const dark_detrimental_Button: BaseTheme = {
  ...dark,
  background: colorsDark.DEP_accentCriticalSoft,
  backgroundHover: colorsLight.DEP_accentCriticalSoft,
  backgroundPress: colorsLight.DEP_accentCriticalSoft,
  color: colorsDark.DEP_accentCritical,
}

// warning
// theme: light
const light_warning_Button: BaseTheme = {
  ...light,
  background: colorsLight.DEP_accentWarningSoft,
  backgroundHover: colorsLight.DEP_accentWarningSoft,
  backgroundPress: colorsLight.DEP_accentWarningSoft,
  color: colorsLight.DEP_accentWarning,
}

// theme: dark
const dark_warning_Button: BaseTheme = {
  ...dark,
  background: colorsDark.DEP_accentWarningSoft,
  backgroundHover: colorsDark.DEP_accentWarningSoft,
  backgroundPress: colorsDark.DEP_accentWarningSoft,
  color: colorsDark.DEP_accentWarning,
}

// combine and narrow theme types before exporting
const allThemes = {
  dark,
  light,
  light_branded,
  dark_branded,
  light_primary,
  dark_primary,
  light_secondary,
  dark_secondary,
  light_tertiary,
  dark_tertiary,
  light_detrimental,
  dark_detrimental,
  light_warning,
  dark_warning,
  light_primary_Button,
  dark_primary_Button,
  light_secondary_Button,
  dark_secondary_Button,
  light_tertiary_Button,
  dark_tertiary_Button,
  light_detrimental_Button,
  dark_detrimental_Button,
  light_warning_Button,
  dark_warning_Button,
}

type ThemeName = keyof typeof allThemes
type Themes = {
  [key in ThemeName]: BaseTheme
}

export const themes: Themes = allThemes
