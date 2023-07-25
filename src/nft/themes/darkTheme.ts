import { Theme, vars } from 'nft/css/sprinkles.css'

export const darkTheme: Theme = {
  colors: {
    neutral1: vars.color.neutral1_dark,
    neutral2: vars.color.neutral2_dark,
    neutral3: vars.color.neutral3_dark,
    surface1: vars.color.surface1_dark,
    surface2: vars.color.surface2_dark,
    surface3: vars.color.surface3_dark,
    surface4: vars.color.surface4_dark,
    surface5: vars.color.surface5_dark,
    accent1: vars.color.accent1_dark,
    accent2: vars.color.accent2_dark,
    scrim: 'rgba(0, 0, 0, 0.60)',

    success: vars.color.success,
    critical: vars.color.critical,

    white: '#FFFFFF',

    //OLD NAMES
    deprecated_accentFailureSoft: 'rgba(253, 118, 107, 0.12)',
    deprecated_gold: vars.color.gold200,
    deprecated_violet: vars.color.violet200,
    deprecated_modalBackdrop: 'linear-gradient(0deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))',
    deprecated_stateOverlayHover: `rgba(153,161,189,0.08)`,
    dropShadow: `0px 4px 16px rgba(76, 130, 251, 0.4)`,
  },
  shadows: {
    menu: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    elevation: '0px 4px 16px rgba(70, 115, 250, 0.4)',
    tooltip: '0px 4px 16px rgba(255, 255, 255, 0.2)',
    deep: '12px 16px 24px rgba(0, 0, 0, 0.24), 12px 8px 12px rgba(0, 0, 0, 0.24), 4px 4px 8px rgba(0, 0, 0, 0.32)',
    shallow: '4px 4px 10px rgba(0, 0, 0, 0.24), 2px 2px 4px rgba(0, 0, 0, 0.12), 1px 2px 2px rgba(0, 0, 0, 0.12)',
  },
  opacity: {
    hover: '0.6',
    pressed: '0.4',
  },
}
