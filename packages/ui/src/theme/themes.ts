// Tamagui syntax for defining sub-themes

import { colorsDark, colorsLight } from 'ui/src/theme/color/colors'
import { opacify } from 'ui/src/theme/color/utils'

// this is just a helper for things that want to accept theme names as props
export type ThemeNames =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'warning'
  | 'detrimental'

// TODO: systematize hover and focus states. requires consolidating mobile and web design systems (they have different button styles right now)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hoverColor = (color: any): string => opacify(85, color)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pressedColor = (color: any): string => opacify(65, color)

// remove $none from theme because it causes issues where $none tokens always resolve to transparent color
// even if they are technically a gap or other space/size property
// tamagui could make this so that themes only apply to color based properties, but would need a release
const { none: darkTransparent, ...tamaguiColorsDark } = colorsDark
const { none: lightTransparent, ...tamaguiColorsLight } = colorsLight

// TODO can convert tokens to createTokens() and then use them here
// Tamagui will automatically convert them though, so it just saves a small amount of performance
const light = {
  // Uniswap Design System
  ...tamaguiColorsLight,
  transparent: lightTransparent,

  // Tamagui Theme
  // Tamagui components expect the following
  background: colorsLight.surface1,
  backgroundHover: colorsLight.surface2,
  backgroundPress: colorsLight.surface2,
  backgroundFocus: colorsLight.surface2,
  borderColor: colorsLight.none,
  borderColorHover: colorsLight.none,
  borderColorFocus: colorsLight.none,
  outlineColor: colorsLight.none,
  color: colorsLight.neutral1,
  colorHover: colorsLight.accent1,
  colorPress: colorsLight.accent1,
  colorFocus: colorsLight.accent1,
  shadowColor: 'rgba(0,0,0,0.15)',
  shadowColorHover: 'rgba(0,0,0,0.2)',
}

type BaseTheme = typeof light

const dark: BaseTheme = {
  ...tamaguiColorsDark,
  transparent: darkTransparent,
  background: colorsDark.surface1,
  backgroundHover: colorsDark.surface2,
  backgroundPress: colorsDark.surface2,
  backgroundFocus: colorsDark.surface2,
  borderColor: colorsDark.none,
  borderColorHover: colorsDark.none,
  borderColorFocus: colorsDark.none,
  outlineColor: colorsDark.none,
  color: colorsDark.neutral1,
  colorHover: colorsDark.accent1,
  colorPress: colorsDark.accent1,
  colorFocus: colorsDark.accent1,
  shadowColor: 'rgba(0,0,0,0.4)',
  shadowColorHover: 'rgba(0,0,0,0.5)',
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
  color: colorsLight.accent1,
}
const dark_branded: BaseTheme = {
  ...dark,
  color: colorsDark.accent1,
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
  color: colorsDark.neutral2,
}
const light_tertiary: BaseTheme = {
  ...light,
}
const dark_tertiary: BaseTheme = {
  ...dark,
}
const light_outline: BaseTheme = {
  ...light,
}
const dark_outline: BaseTheme = {
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
  background: colorsLight.accent1,
  backgroundHover: hoverColor(colorsLight.accent1),
  backgroundPress: pressedColor(colorsLight.accent1),
  color: colorsLight.sporeWhite,
}

// theme: dark
const dark_primary_Button: BaseTheme = {
  ...dark,
  background: colorsDark.accent1,
  backgroundHover: hoverColor(colorsDark.accent1),
  backgroundPress: pressedColor(colorsDark.accent1),
  color: colorsDark.sporeWhite,
}

// secondary
// theme: light
const light_secondary_Button: BaseTheme = {
  ...light,
  background: colorsLight.surface2,
  backgroundHover: hoverColor(colorsLight.surface2),
  backgroundPress: pressedColor(colorsLight.surface2),
  color: colorsLight.sporeBlack,
}

// theme: dark
const dark_secondary_Button: BaseTheme = {
  ...dark,
  background: colorsDark.surface2,
  backgroundHover: hoverColor(colorsDark.surface2),
  backgroundPress: pressedColor(colorsDark.surface2),
  color: colorsDark.sporeWhite,
}

// tertiary
// theme: light
const light_tertiary_Button: BaseTheme = {
  ...light,
  background: colorsLight.surface3,
  // TODO(MOB-2206): make hover and press colors different from each other and more consistent with other buttons
  backgroundHover: colorsLight.surface2,
  backgroundPress: colorsLight.surface2,
  borderColor: colorsLight.none,
  color: colorsLight.neutral1,
}

// theme: dark
const dark_tertiary_Button: BaseTheme = {
  ...dark,
  background: colorsDark.surface3,
  // TODO(MOB-2206): make hover and press colors different from each other and more consistent with other buttons
  backgroundHover: colorsDark.surface2,
  backgroundPress: colorsDark.surface2,
  borderColor: colorsDark.none,
  color: colorsDark.neutral1,
}

// outline
// theme: light
const light_outline_Button: BaseTheme = {
  ...light,
  background: colorsLight.none,
  backgroundHover: colorsLight.none,
  backgroundPress: colorsLight.none,
  borderColor: colorsLight.surface3,
  color: colorsLight.neutral1,
}

// theme: dark
const dark_outline_Button: BaseTheme = {
  ...dark,
  background: colorsDark.none,
  backgroundHover: colorsDark.none,
  backgroundPress: colorsDark.none,
  borderColor: colorsDark.surface3,
  color: colorsDark.neutral1,
}

// detrimental
// theme: light
const light_detrimental_Button: BaseTheme = {
  ...light,
  background: colorsLight.DEP_accentCriticalSoft,
  backgroundHover: colorsLight.DEP_accentCriticalSoft,
  backgroundPress: colorsLight.DEP_accentCriticalSoft,
  color: colorsLight.statusCritical,
}

// theme: dark
const dark_detrimental_Button: BaseTheme = {
  ...dark,
  background: colorsDark.DEP_accentCriticalSoft,
  backgroundHover: colorsLight.DEP_accentCriticalSoft,
  backgroundPress: colorsLight.DEP_accentCriticalSoft,
  color: colorsDark.statusCritical,
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
  light_outline,
  dark_outline,
  light_outline_Button,
  dark_outline_Button,
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
