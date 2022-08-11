import { Theme, vars } from '../css/sprinkles.css'

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
    blackBlue: vars.color.grey900,
    blackBlue20: `#0E111A33`,
    darkGray: vars.color.grey500,
    medGray: `#5E68873D`,
    lightGray: vars.color.grey50,
    white: '#FFFFFF',
    darkGray10: `#5E68871A`,
    explicitWhite: '#FFFFFF',
    magicGradient: vars.color.pink400,
    placeholder: vars.color.grey300,
    lightGrayButton: vars.color.grey100,
    lightGrayContainer: vars.color.grey100,
    lightGrayOverlay: '#E6E8F0',

    // Opacities of black and white
    white95: '#EDEFF7F2',
    white90: '#FFFFFFE5',
    white80: '#FFFFFFCC',
  },
  shadows: {
    menu: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    genieBlue: '0 4px 16px 0 rgba(251, 17, 142)',
    elevation: '0px 4px 16px rgba(70, 115, 250, 0.4)',
    tooltip: '0px 4px 16px rgba(10, 10, 59, 0.2)',
  },
}
