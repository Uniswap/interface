// Tamagui syntax for defining sub-themes

import { createTheme } from 'tamagui'
import { tamaguiDark as colorsDark, tamaguiLight as colorsLight } from 'ui/theme/color'
import { opacify } from 'ui/theme/color/utils'

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
  ...light,
  ...colorsDark,
  background: colorsDark.background0,
  backgroundHover: colorsDark.background1,
  backgroundPress: colorsDark.background1,
  backgroundFocus: colorsDark.background1,
  borderColor: colorsDark.none,
  borderColorHover: colorsDark.none,
  color: colorsDark.textPrimary,
  colorHover: colorsDark.userThemeMagenta,
  colorPress: colorsDark.userThemeMagenta,
  colorFocus: colorsDark.userThemeMagenta,
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
  color: colorsLight.magentaVibrant,
}
const dark_branded: BaseTheme = {
  ...dark,
  color: colorsDark.magentaVibrant,
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
  color: colorsDark.textSecondary,
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
  background: colorsLight.magentaVibrant,
  backgroundHover: hoverColor(colorsLight.magentaVibrant),
  backgroundPress: pressedColor(colorsLight.magentaVibrant),
}
const light_primary_ButtonText: BaseTheme = {
  ...light,
  color: colorsLight.textOnDimPrimary,
}
// theme: dark
const dark_primary_Button: BaseTheme = {
  ...dark,
  background: colorsDark.magentaVibrant,
  backgroundHover: hoverColor(colorsDark.magentaVibrant),
  backgroundPress: pressedColor(colorsDark.magentaVibrant),
}
const dark_primary_ButtonText: BaseTheme = {
  ...dark,
  color: colorsDark.textOnDimPrimary,
}

// secondary
// theme: light
const light_secondary_Button: BaseTheme = {
  ...light,
  background: colorsLight.background3,
  backgroundHover: hoverColor(colorsLight.background3),
  backgroundPress: pressedColor(colorsLight.background3),
}
const light_secondary_ButtonText: BaseTheme = {
  ...light,
  color: colorsLight.textOnBrightPrimary,
}
// theme: dark
const dark_secondary_Button: BaseTheme = {
  ...dark,
  background: colorsDark.background3,
  backgroundHover: hoverColor(colorsDark.background3),
  backgroundPress: pressedColor(colorsDark.background3),
}
const dark_secondary_ButtonText: BaseTheme = {
  ...dark,
  color: colorsDark.textOnBrightPrimary,
}

// tertiary
// theme: light
const light_tertiary_Button: BaseTheme = {
  ...light,
  background: colorsLight.none,
  backgroundHover: colorsLight.none,
  backgroundPress: colorsLight.none,
  borderColor: colorsLight.backgroundOutline,
}
const light_tertiary_ButtonText: BaseTheme = {
  ...light,
  color: colorsLight.textOnBrightPrimary,
}
// theme: dark
const dark_tertiary_Button: BaseTheme = {
  ...dark,
  background: colorsDark.none,
  backgroundHover: colorsDark.none,
  backgroundPress: colorsDark.none,
  borderColor: colorsDark.backgroundOutline,
}
const dark_tertiary_ButtonText: BaseTheme = {
  ...dark,
  color: colorsDark.textOnBrightPrimary,
}

// detrimental
// theme: light
const light_detrimental_Button: BaseTheme = {
  ...light,
  background: colorsLight.accentCriticalSoft,
  backgroundHover: colorsLight.accentCriticalSoft,
  backgroundPress: colorsLight.accentCriticalSoft,
}
const light_detrimental_ButtonText: BaseTheme = {
  ...light,
  color: colorsLight.accentCritical,
}
// theme: dark
const dark_detrimental_Button: BaseTheme = {
  ...dark,
  background: colorsDark.accentCriticalSoft,
  backgroundHover: colorsLight.accentCriticalSoft,
  backgroundPress: colorsLight.accentCriticalSoft,
}
const dark_detrimental_ButtonText: BaseTheme = {
  ...dark,
  color: colorsDark.accentCritical,
}

// warning
// theme: light
const light_warning_Button: BaseTheme = {
  ...light,
  background: colorsLight.accentWarningSoft,
  backgroundHover: colorsLight.accentWarningSoft,
  backgroundPress: colorsLight.accentWarningSoft,
}
const light_warning_ButtonText: BaseTheme = {
  ...light,
  color: colorsLight.accentWarning,
}
// theme: dark
const dark_warning_Button: BaseTheme = {
  ...dark,
  background: colorsDark.accentWarningSoft,
  backgroundHover: colorsDark.accentWarningSoft,
  backgroundPress: colorsDark.accentWarningSoft,
}
const dark_warning_ButtonText: BaseTheme = {
  ...dark,
  color: colorsDark.accentWarning,
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
  light_primary_ButtonText,
  dark_primary_ButtonText,
  light_secondary_Button,
  dark_secondary_Button,
  light_secondary_ButtonText,
  dark_secondary_ButtonText,
  light_tertiary_Button,
  dark_tertiary_Button,
  light_tertiary_ButtonText,
  dark_tertiary_ButtonText,
  light_detrimental_Button,
  dark_detrimental_Button,
  light_detrimental_ButtonText,
  dark_detrimental_ButtonText,
  light_warning_Button,
  dark_warning_Button,
  light_warning_ButtonText,
  dark_warning_ButtonText,
}

type ThemeName = keyof typeof allThemes
type Themes = {
  [key in ThemeName]: BaseTheme
}

export const themes: Themes = allThemes
