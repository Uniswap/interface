import { Theme } from '@pollum-io/widgets'
import { darkTheme, lightTheme } from 'theme/colors'
import { Z_INDEX } from 'theme/zIndex'

const zIndex = {
  modal: Z_INDEX.modal,
}

const fonts = {
  fontFamily: 'Inter custom',
}

export const LIGHT_THEME: Theme = {
  // surface
  accent: lightTheme.accentAction,
  // accentActive: lightTheme.accentActive,
  accentSoft: lightTheme.accentActionSoft,
  container: lightTheme.backgroundSurface,
  module: lightTheme.backgroundModule,
  interactive: lightTheme.backgroundInteractive,
  outline: lightTheme.backgroundOutline,
  dialog: lightTheme.backgroundBackdrop,
  scrim: lightTheme.backgroundScrim,
  // backgroundScrim: lightTheme.backgroundScrolledSurface,
  // text
  onAccent: lightTheme.white,
  primary: lightTheme.textPrimary,
  secondary: lightTheme.textSecondary,
  hint: lightTheme.textTertiary,
  onInteractive: lightTheme.accentTextDarkPrimary,
  // shadow
  deepShadow: lightTheme.deepShadow,
  networkDefaultShadow: lightTheme.networkDefaultShadow,

  // state
  success: lightTheme.accentSuccess,
  warning: lightTheme.accentWarning,
  error: lightTheme.accentCritical,

  ...fonts,
  zIndex,
}

export const DARK_THEME: Theme = {
  // surface
  accent: darkTheme.accentAction,
  // accentActive: darkTheme.accentActive,
  accentSoft: darkTheme.accentActionSoft,
  container: darkTheme.backgroundSurface,
  module: darkTheme.backgroundModule,
  interactive: darkTheme.backgroundInteractive,
  outline: darkTheme.backgroundOutline,
  dialog: darkTheme.backgroundBackdrop,
  scrim: darkTheme.backgroundScrim,
  // backgroundScrim: darkTheme.backgroundScrolledSurface,
  // text
  onAccent: darkTheme.white,
  primary: darkTheme.textPrimary,
  secondary: darkTheme.textSecondary,
  hint: darkTheme.textTertiary,
  onInteractive: darkTheme.accentTextLightPrimary,
  // shadow
  deepShadow: darkTheme.deepShadow,
  networkDefaultShadow: darkTheme.networkDefaultShadow,
  // state
  success: darkTheme.accentSuccess,
  warning: darkTheme.accentWarning,
  error: darkTheme.accentCritical,

  ...fonts,
  zIndex,
}
