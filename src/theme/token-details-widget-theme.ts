import { colors } from './colors'

export const LIGHT_THEME = {
  // surface
  container: '#EDEFF7',
  interactive: '#EDEFF7',
  module: '#E1E4EE',
  accent: colors.pink400,
  dialog: '#E1E4EE',
  // text
  primary: colors.gray900,
  secondary: colors.gray500,
  onInteractive: colors.gray900,
  // state
  success: colors.green400,
  warning: colors.gold200,
  error: colors.red400,
}
export const DARK_THEME = {
  // surface
  container: colors.gray900,
  interactive: 'rgba(153, 161, 189, 0.08)',
  module: '#191D27',
  accent: colors.blue400,
  dialog: '#191D27',
  // text
  primary: colors.white,
  secondary: colors.gray300,
  onInteractive: colors.white,
  // state
  success: colors.greenVibrant,
  warning: colors.gold200,
  error: colors.red400,
}
