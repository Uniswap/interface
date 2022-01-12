// Based mostly on https://github.com/Uniswap/interface/blob/main/src/theme/index.tsx

export interface Palette {
  primary1: string
  primary2: string
  primary3: string
  primaryText: string
  secondary1: string
  secondary2: string
  background1: string
  white: string
  black: string
  gray50: string
  gray100: string
  gray200: string
  gray400: string
  gray600: string
  paleBlue: string
  blue: string
  green: string
  pink: string
  palePink: string
  orange: string
  paleOrange: string
  red: string
  yellow: string
  success: string
  warning: string
  error: string
  none: string

  chain_1: string
  chain_3: string
  chain_4: string
  chain_5: string
  chain_10: string
  chain_42: string
  chain_69: string
  chain_42161: string
  chain_421611: string
}

export const colorsLight: Palette = {
  primary1: '#FF007A',
  primary2: '#FF8CC3',
  primary3: '#FF99C9',
  primaryText: '#D50066',
  secondary1: '#F6DDE8',
  secondary2: '#FDEAF1',
  background1: '#F7F8FA',
  white: '#FFFFFF',
  black: '#27252E',
  gray50: '#F2F2F2',
  gray100: '#E3E3E3',
  gray200: '#B8B8B8',
  gray400: '#858585',
  gray600: '#4F4F4F',
  paleBlue: '#F4F8FE',
  blue: '#426CFF',
  green: '#28CD88',
  pink: '#FF007A',
  palePink: '#FFF2F8',
  orange: '#FD4040',
  paleOrange: '#FFECEC',
  red: '#DA2D2B',
  yellow: '#E3A507',
  success: '#007D35',
  warning: '#FF8F00',
  error: '#DF1F38',
  none: 'transparent',

  chain_1: '#627EEA',
  chain_3: '#E3A507',
  chain_4: '#FF007A',
  chain_5: '#007D35',
  chain_10: '#ff0420',
  chain_42: '#426CFF',
  chain_69: '#ff0420',
  chain_42161: '#f22020',
  chain_421611: '#f22020',
}

export const colorsDark: Palette = {
  primary1: '#2172E5',
  primary2: '#3680E7',
  primary3: '#4D8FEA',
  primaryText: '#5090ea',
  secondary1: '#17000b26',
  secondary2: '#17000b26',
  background1: '#F7F8FA',
  white: '#FFFFFF',
  black: '#27252E',
  gray50: '#f2f2f2',
  gray100: '#e3e3e3',
  gray200: '#b8b8b8',
  gray400: '#858585',
  gray600: '#4f4f4f',
  paleBlue: '#F4F8FE',
  blue: '#2172E5',
  green: '#27AE60',
  pink: '#FF007A',
  palePink: '#FFF2F8',
  orange: '#FD4040',
  paleOrange: '#FFECEC',
  red: '#FF4343',
  yellow: '#E3A507',
  success: '#27AE60',
  warning: '#FF8F00',
  error: '#FD4040',
  none: 'transparent',

  chain_1: '#627EEA',
  chain_3: '#E3A507',
  chain_4: '#FF007A',
  chain_5: '#007D35',
  chain_10: '#ff0420',
  chain_42: '#426CFF',
  chain_69: '#ff0420',
  chain_42161: '#f22020',
  chain_421611: '#f22020',
}
