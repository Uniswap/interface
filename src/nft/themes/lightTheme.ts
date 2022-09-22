import { Theme, vars } from 'nft/css/sprinkles.css'
import { opacify } from 'theme/utils'

export const lightTheme: Theme = {
  colors: {
    accentFailure: vars.color.red400,
    modalBackdrop: 'rgba(0, 0, 0, 0.3)',
    textPrimary: vars.color.grey900,
    backgroundSurface: '#FFFFFF',
    textSecondary: vars.color.grey500,
    backgroundOutline: opacify(24, vars.color.grey500),
    stateOverlayHover: opacify(8, vars.color.grey300),
    explicitWhite: '#FFFFFF',
    backgroundAction: vars.color.pink400,
    textTertiary: vars.color.grey300,
    backgroundInteractive: vars.color.grey100,
    backgroundModule: vars.color.grey50,

    // Opacities of black and white
    accentActionSoft: '#FFFFFFE5',
    backgroundFloating: '#00000000',
  },
  shadows: {
    menu: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    genieBlue: '0 4px 16px 0 rgba(251, 17, 142)',
    elevation: '0px 4px 16px rgba(70, 115, 250, 0.4)',
    tooltip: '0px 4px 16px rgba(10, 10, 59, 0.2)',
  },
}
