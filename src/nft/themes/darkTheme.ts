import { Theme, vars } from 'nft/css/sprinkles.css'

export const darkTheme: Theme = {
  colors: {
    accentFailure: vars.color.critical,
    accentFailureSoft: 'rgba(253, 118, 107, 0.12)',
    accentAction: vars.color.accent1_dark,
    accentActionSoft: vars.color.accent2_dark,
    accentSuccess: vars.color.success,

    explicitWhite: '#FFFFFF',
    green: vars.color.success,
    gold: vars.color.gold200,
    violet: vars.color.violet200,

    backgroundBackdrop: vars.color.surface1_dark,
    backgroundSurface: vars.color.surface1_dark,
    backgroundModule: vars.color.surface2_dark,
    backgroundFloating: vars.color.surface3_dark,
    backgroundInteractive: vars.color.surface3_dark,
    backgroundOutline: vars.color.surface3_dark,

    modalBackdrop: 'linear-gradient(0deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))',

    searchBackground: `rgba(255,255,255,0.07)`,
    searchOutline: `rgba(255,255,255,0.07)`,
    stateOverlayHover: `rgba(153,161,189,0.08)`,

    textPrimary: vars.color.neutral1_dark,
    textSecondary: vars.color.neutral2_dark,
    textTertiary: vars.color.neutral3_dark,

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
