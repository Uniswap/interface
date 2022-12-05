import { Theme, vars } from 'nft/css/sprinkles.css'

export const lightTheme: Theme = {
  colors: {
    accentFailure: vars.color.red400,
    accentFailureSoft: 'rgba(250, 43, 57, 0.12)',
    accentAction: vars.color.pink400,
    accentActionSoft: vars.color.accentActionSoft,
    accentSuccess: vars.color.green300,

    explicitWhite: '#FFFFFF',

    backgroundFloating: '#00000000',
    backgroundInteractive: vars.color.gray50,
    backgroundModule: vars.color.gray50,
    backgroundOutline: vars.color.gray100,
    backgroundSurface: '#FFFFFF',
    backgroundBackdrop: '#FFF',

    modalBackdrop: 'rgba(0, 0, 0, 0.3)',

    searchBackground: `rgba(255,255,255,0.4)`,
    searchOutline: `rgba(0,0,0,0.1)`,
    stateOverlayHover: `rgba(153,161,189,0.08)`,
    green: vars.color.green400,
    gold: vars.color.gold400,
    violet: vars.color.violet400,

    textPrimary: vars.color.gray900,
    textSecondary: vars.color.gray500,
    textTertiary: vars.color.gray300,

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
