import { colors } from './colors'
import { opacify } from './utils'

function getDeprecatedTheme(darkMode: boolean) {
  return {
    // text
    deprecated_text4: darkMode ? colors.gray200 : colors.gray300,

    // backgrounds / grays

    // we could move this to `background`, but gray50 is a bit different from #FAFAFA
    deprecated_bg1: darkMode ? colors.gray800 : colors.gray50,

    deprecated_bg3: darkMode ? colors.gray600 : colors.gray200,
    deprecated_bg4: darkMode ? colors.gray500 : colors.gray300,
    deprecated_bg5: darkMode ? colors.gray400 : colors.gray400,

    //specialty colors
    deprecated_advancedBG: darkMode ? opacify(10, colors.black) : opacify(60, colors.white),

    //primary colors
    deprecated_primary2: darkMode ? colors.blue400 : colors.pink300,
    deprecated_primary3: darkMode ? colors.blue300 : colors.pink200,
    deprecated_primary4: darkMode ? '#376bad70' : '#F6DDE8',
    deprecated_primary5: darkMode ? '#153d6f70' : '#FDEAF1',

    // secondary colors
    deprecated_secondary2: darkMode ? opacify(25, colors.gray900) : '#F6DDE8',
    deprecated_secondary3: darkMode ? opacify(25, colors.gray900) : '#FDEAF1',

    // other
    deprecated_yellow1: colors.yellow400,
    deprecated_yellow2: colors.yellow500,
    deprecated_yellow3: colors.yellow600,

    // dont wanna forget these blue yet
    deprecated_blue4: darkMode ? '#153d6f70' : '#C4D9F8',
  }
}

export const lightDeprecatedTheme = getDeprecatedTheme(false)
export const darkDeprecatedTheme = getDeprecatedTheme(true)
