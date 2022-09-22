import { Theme, vars } from 'nft/css/sprinkles.css'
import { opacify } from 'theme/utils'

export const lightTheme: Theme = {
  colors: {
    error: '#FF494A',
    textDisconnect: '#FF494A',
    modalBackdrop: 'rgba(0, 0, 0, 0.3)',
    backgroundSecondary: '#FCFCFD',
    modalClose: 'rgba(60, 66, 82, 0.06)',
    text: '#25292E',
    modalTextSecondary: 'rgba(60, 66, 82, 0.6)',

    // Bryan's colors from Figma that vary dark vs light
    textPrimary: vars.color.grey900,
    backgroundSurface: '#FFFFFF',
    textSecondary: vars.color.grey500,
    backgroundOutline: opacify(24, vars.color.grey500),
    white: '#FFFFFF',
    backgroundModule: opacify(8, vars.color.grey300),
    explicitWhite: '#FFFFFF',
    magicGradient: vars.color.pink400,
    placeholder: vars.color.grey300,
    backgroundInteractive: vars.color.grey100,
    loading: vars.color.grey50,

    // Opacities of black and white
    white95: '#EDEFF7F2',
    white90: '#FFFFFFE5',
    white80: '#FFFFFFCC',
    white08: '#00000000',
    backgroundFloating: '#29324908',
  },
  shadows: {
    menu: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    genieBlue: '0 4px 16px 0 rgba(251, 17, 142)',
    elevation: '0px 4px 16px rgba(70, 115, 250, 0.4)',
    tooltip: '0px 4px 16px rgba(10, 10, 59, 0.2)',
  },
}
