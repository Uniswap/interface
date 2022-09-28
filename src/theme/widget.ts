import { colorsDark, colorsLight } from './colors'

export const LIGHT_THEME = {
  // surface
  container: colorsLight.backgroundSurface,
  interactive: colorsLight.backgroundInteractive,
  module: colorsLight.backgroundModule,
  accent: colorsLight.accentAction,
  dialog: colorsLight.backgroundBackdrop,
  outline: colorsLight.backgroundOutline,
  // text
  primary: colorsLight.textPrimary,
  secondary: colorsLight.textSecondary,
  onInteractive: colorsLight.accentTextDarkPrimary,
  // state
  success: colorsLight.accentSuccess,
  warning: colorsLight.accentWarning,
  error: colorsLight.accentCritical,
}

export const DARK_THEME = {
  // surface
  container: colorsDark.backgroundSurface,
  interactive: colorsDark.backgroundInteractive,
  module: colorsDark.backgroundModule,
  accent: colorsDark.accentAction,
  dialog: colorsDark.backgroundBackdrop,
  outline: colorsDark.backgroundOutline,
  // text
  primary: colorsDark.textPrimary,
  secondary: colorsDark.textSecondary,
  onInteractive: colorsDark.accentTextLightPrimary,
  // state
  success: colorsDark.accentSuccess,
  warning: colorsDark.accentWarning,
  error: colorsDark.accentCritical,
}
