import { colors } from 'theme/colors'
import { opacify } from 'ui/src/theme'

function getDeprecatedTheme(darkMode: boolean) {
  return {
    // other
    deprecated_yellow3: colors.yellow600,

    deprecated_accentWarning: colors.gold200,

    deprecated_accentFailureSoft: opacify(12, darkMode ? colors.critical_dark : colors.critical_light),

    deprecated_accentTextLightPrimary: colors.gray50,
    deprecated_deepShadow: darkMode
      ? '12px 16px 24px rgba(0, 0, 0, 0.24), 12px 8px 12px rgba(0, 0, 0, 0.24), 4px 4px 8px rgba(0, 0, 0, 0.32);'
      : '8px 12px 20px rgba(51, 53, 72, 0.04), 4px 6px 12px rgba(51, 53, 72, 0.02), 4px 4px 8px rgba(51, 53, 72, 0.04);',
    deprecated_shallowShadow: darkMode
      ? '0px 0px 10px 0px rgba(34, 34, 34, 0.04);'
      : '0px 0px 10px 0px rgba(34, 34, 34, 0.04);',

    deprecated_stateOverlayHover: opacify(8, colors.gray300),
    deprecated_stateOverlayPressed: opacify(24, colors.gray200),
    deprecated_hoverDefault: opacify(8, colors.gray300),
  }
}

export const lightDeprecatedTheme = getDeprecatedTheme(false)
export const darkDeprecatedTheme = getDeprecatedTheme(true)
