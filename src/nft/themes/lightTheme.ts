import { Theme, vars } from 'nft/css/sprinkles.css'

export const lightTheme: Theme = {
  colors: {
    accentFailure: vars.color.critical,
    accentFailureSoft: 'rgba(250, 43, 57, 0.12)',
    accentAction: vars.color.accent1_light,
    accentActionSoft: vars.color.accent1_light,
    accentSuccess: vars.color.success,

    explicitWhite: '#FFFFFF',

    backgroundFloating: '#00000000',
    backgroundInteractive: vars.color.surface3_light,
    backgroundModule: vars.color.surface3_light,
    backgroundOutline: vars.color.surface3_light,
    backgroundSurface: vars.color.surface1_light,
    backgroundBackdrop: vars.color.surface2_light,

    modalBackdrop: 'rgba(0, 0, 0, 0.3)',

    searchBackground: `rgba(255,255,255,0.4)`,
    searchOutline: `rgba(0,0,0,0.1)`,
    stateOverlayHover: `rgba(153,161,189,0.08)`,
    green: vars.color.success,
    gold: vars.color.gold400,
    violet: vars.color.violet400,

    textPrimary: vars.color.neutral1_light,
    textSecondary: vars.color.neutral2_light,
    textTertiary: vars.color.neutral3_light,

    dropShadow: `0px 4px 16px rgba(251, 17, 142, 0.4)`,
  },
  shadows: {
    menu: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    elevation: '0px 4px 16px rgba(70, 115, 250, 0.4)',
    tooltip: '0px 4px 16px rgba(10, 10, 59, 0.2)',
    deep: '8px 12px 20px rgba(51, 53, 72, 0.04), 4px 6px 12px rgba(51, 53, 72, 0.02), 4px 4px 8px rgba(51, 53, 72, 0.04)',
    shallow: '4px 4px 10px rgba(0, 0, 0, 0.24), 2px 2px 4px rgba(0, 0, 0, 0.12), 1px 2px 2px rgba(0, 0, 0, 0.12)',
  },
  opacity: {
    hover: '0.6',
    pressed: '0.4',
  },
}
