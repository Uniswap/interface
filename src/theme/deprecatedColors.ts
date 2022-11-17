import { colors, darkTheme, lightTheme } from './colors'
import { opacify } from './utils'

function getDeprecatedTheme(darkMode: boolean) {
  return {
    // base
    deprecated_white: colors.white,
    deprecated_black: colors.black,

    // text
    deprecated_text1: darkMode ? darkTheme.textPrimary : lightTheme.textPrimary,
    deprecated_text2: darkMode ? darkTheme.textSecondary : lightTheme.textSecondary,
    deprecated_text3: darkMode ? darkTheme.textTertiary : lightTheme.textTertiary,
    deprecated_text4: darkMode ? colors.gray200 : colors.gray300,
    deprecated_text5: darkMode ? colors.gray500 : colors.gray50,

    // backgrounds / grays
    deprecated_bg0: darkMode ? colors.gray900 : colors.white,
    deprecated_bg1: darkMode ? colors.gray800 : colors.gray50,
    deprecated_bg2: darkMode ? colors.gray700 : colors.gray100,
    deprecated_bg3: darkMode ? colors.gray600 : colors.gray200,
    deprecated_bg4: darkMode ? colors.gray500 : colors.gray300,
    deprecated_bg5: darkMode ? colors.gray400 : colors.gray400,
    deprecated_bg6: darkMode ? colors.gray300 : colors.gray500,

    //specialty colors
    deprecated_modalBG: darkMode ? opacify(40, colors.black) : opacify(30, colors.black),
    deprecated_advancedBG: darkMode ? opacify(10, colors.black) : opacify(60, colors.white),

    //primary colors
    deprecated_primary1: darkMode ? darkTheme.accentAction : lightTheme.accentAction,
    deprecated_primary2: darkMode ? colors.blue400 : colors.pink300,
    deprecated_primary3: darkMode ? colors.blue300 : colors.pink200,
    deprecated_primary4: darkMode ? '#376bad70' : '#F6DDE8',
    deprecated_primary5: darkMode ? '#153d6f70' : '#FDEAF1',

    // color text
    deprecated_primaryText1: darkMode ? darkTheme.accentAction : lightTheme.accentAction,

    // secondary colors
    deprecated_secondary1: darkMode ? darkTheme.accentAction : lightTheme.accentAction,
    deprecated_secondary2: darkMode ? opacify(25, colors.gray900) : '#F6DDE8',
    deprecated_secondary3: darkMode ? opacify(25, colors.gray900) : '#FDEAF1',

    // other
    deprecated_red1: darkMode ? darkTheme.accentFailure : lightTheme.accentFailure,
    deprecated_red2: darkMode ? darkTheme.accentFailure : lightTheme.accentFailure,
    deprecated_red3: darkMode ? darkTheme.accentFailure : lightTheme.accentFailure,
    deprecated_green1: darkMode ? darkTheme.accentSuccess : lightTheme.accentSuccess,
    deprecated_yellow1: colors.yellow400,
    deprecated_yellow2: colors.yellow500,
    deprecated_yellow3: colors.yellow600,
    deprecated_blue1: darkMode ? darkTheme.accentAction : lightTheme.accentAction,
    deprecated_blue2: darkMode ? darkTheme.accentAction : lightTheme.accentAction,
    deprecated_error: darkMode ? darkTheme.accentFailure : lightTheme.accentFailure,
    deprecated_success: darkMode ? darkTheme.accentSuccess : lightTheme.accentSuccess,
    deprecated_warning: darkMode ? darkTheme.accentWarning : lightTheme.accentWarning,

    // dont wanna forget these blue yet
    deprecated_blue4: darkMode ? '#153d6f70' : '#C4D9F8',
  }
}

export const lightDeprecatedTheme = getDeprecatedTheme(false)
export const darkDeprecatedTheme = getDeprecatedTheme(true)
