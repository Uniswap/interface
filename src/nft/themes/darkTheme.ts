import { Theme, vars } from 'nft/css/sprinkles.css'

export const darkTheme: Theme = {
  colors: {
    accentFailure: vars.color.red300,
    modalBackdrop: 'linear-gradient(0deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))',
    textPrimary: '#FFFFFF',
    backgroundSurface: vars.color.grey900,
    textSecondary: vars.color.grey300,
    backgroundOutline: `rgba(153,161,189,0.24)`,
    stateOverlayHover: `rgba(153,161,189,0.08)`,
    explicitWhite: '#FFFFFF',
    backgroundAction: vars.color.blue400,
    textTertiary: vars.color.grey500,
    backgroundInteractive: vars.color.grey700,
    backgroundModule: vars.color.grey800,

    // Opacities of black and white
    accentActionSoft: '#000000E5',
    backgroundFloating: '0000000C',
  },
  shadows: {
    menu: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    genieBlue: '0 4px 16px 0 rgba(70, 115, 250, 0.4)',
    elevation: '0px 4px 16px rgba(70, 115, 250, 0.4)',
    tooltip: '0px 4px 16px rgba(255, 255, 255, 0.2)',
  },
}
