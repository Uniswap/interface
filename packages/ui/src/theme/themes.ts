import { colorsDark, colorsLight } from 'ui/src/theme/color/colors'

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

// combine and narrow theme types before exporting
const allThemes = {
  dark,
  light,
}

type ThemeName = keyof typeof allThemes
type Themes = {
  [key in ThemeName]: BaseTheme
}

export const themes: Themes = allThemes
