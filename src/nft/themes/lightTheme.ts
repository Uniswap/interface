import { Theme, vars } from 'nft/css/sprinkles.css'

export const lightTheme: Theme = {
  colors: {
    accentFailure: vars.color.red400,
    accentFailureSoft: 'rgba(250, 43, 57, 0.12)',
    accentAction: vars.color.pink400,
    accentActionSoft: 'rgba(251, 17, 142, 0.12)',

    explicitWhite: '#FFFFFF',

    backgroundFloating: '#00000000',
    backgroundInteractive: vars.color.grey100,
    backgroundModule: vars.color.grey50,
    backgroundOutline: `rgba(94,104,135,0.24)`,
    backgroundSurface: '#FFFFFF',

    modalBackdrop: 'rgba(0, 0, 0, 0.3)',

    stateOverlayHover: `rgba(153,161,189,0.08)`,
    green: vars.color.green400,
    gold: vars.color.gold400,
    violet: vars.color.violet400,

    textPrimary: vars.color.grey900,
    textSecondary: vars.color.grey500,
    textTertiary: vars.color.grey300,
  },
  shadows: {
    menu: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    genieBlue: '0 4px 16px 0 rgba(251, 17, 142)',
    elevation: '0px 4px 16px rgba(70, 115, 250, 0.4)',
    tooltip: '0px 4px 16px rgba(10, 10, 59, 0.2)',
    deep: '8px 12px 20px rgba(51, 53, 72, 0.04), 4px 6px 12px rgba(51, 53, 72, 0.02), 4px 4px 8px rgba(51, 53, 72, 0.04)',
  },
}
