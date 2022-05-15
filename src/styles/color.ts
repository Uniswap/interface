// Based mostly on https://github.com/Uniswap/interface/blob/main/src/theme/index.tsx

import { opacify } from 'src/utils/colors'

export interface GlobalPalette {
  white: string
  black: string
  gray50: string
  gray100: string
  gray200: string
  gray300: string
  gray400: string
  gray500: string
  gray600: string
  gray700: string
  gray800: string
  gray900: string
  pink50: string
  pink100: string
  pink200: string
  pink300: string
  pink400: string
  pink500: string
  pink600: string
  pink700: string
  pink800: string
  pink900: string
  red50: string
  red100: string
  red200: string
  red300: string
  red400: string
  red500: string
  red600: string
  red700: string
  red800: string
  red900: string
  yellow50: string
  yellow100: string
  yellow200: string
  yellow300: string
  yellow400: string
  yellow500: string
  yellow600: string
  yellow700: string
  yellow800: string
  yellow900: string
  green50: string
  green100: string
  green200: string
  green300: string
  green400: string
  green500: string
  green600: string
  green700: string
  green800: string
  green900: string
  blue50: string
  blue100: string
  blue200: string
  blue300: string
  blue400: string
  blue500: string
  blue600: string
  blue700: string
  blue800: string
  blue900: string
  networkEthereum: string
  networkOptimism: string
  networkOptimismSoft: string
  networkPolygon: string
  networkArbitrum: string
  networkPolygonSoft: string
  networkEthereumSoft: string
}

export const colors: GlobalPalette = {
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F4F6FE',
  gray100: '#DBE1F5',
  gray200: '#C0C7DE',
  gray300: '#99A1BD',
  gray400: '#747D9C',
  gray500: '#5F667D',
  gray600: '#44495A',
  gray700: '#272A35',
  gray800: '#181B24',
  gray900: '#070A15',
  pink50: '#FFF2F7',
  pink100: '#FFD7E3',
  pink200: '#FBA4C0',
  pink300: '#FF6FA3',
  pink400: '#EF368E',
  pink500: '#C41969',
  pink600: '#8C0F49',
  pink700: '#55072A',
  pink800: '#350318',
  pink900: '#2B000B',
  red50: '#FFF4EE',
  red100: '#FFD9CE',
  red200: '#FDA799',
  red300: '#FF776D',
  red400: '#FD4040',
  red500: '#C52533',
  red600: '#891E20',
  red700: '#530F10',
  red800: '#350700',
  red900: '#2C0000',
  yellow50: '#FFF5E8',
  yellow100: '#F8DEB6',
  yellow200: '#F3B71E',
  yellow300: '#DC910D',
  yellow400: '#AE780C',
  yellow500: '#8F5C0F',
  yellow600: '#643F07',
  yellow700: '#3F2208',
  yellow800: '#26130A',
  yellow900: '#110A00',
  green50: '#EAFAED',
  green100: '#BDECC8',
  green200: '#75D090',
  green300: '#35AD63',
  green400: '#1A9550',
  green500: '#07773D',
  green600: '#0C522A',
  green700: '#053117',
  green800: '#031C0A',
  green900: '#020E04',
  blue50: '#F4F6FF',
  blue100: '#DBDFFF',
  blue200: '#AABAFF',
  blue300: '#829BFF',
  blue400: '#407CF8',
  blue500: '#1869D8',
  blue600: '#1D4294',
  blue700: '#09265E',
  blue800: '#06163B',
  blue900: '#00072F',
  networkEthereum: '#627EEA',
  networkOptimism: '#FF0420',
  networkOptimismSoft: 'rgba(255, 4, 32, 0.16)',
  networkPolygon: '#A457FF',
  networkArbitrum: '#28A0F0',
  networkPolygonSoft: 'rgba(164, 87, 255, 0.16)',
  networkEthereumSoft: 'rgba(98, 126, 234, 0.16)',
}

export interface Palette {
  deprecated_primary1: string
  deprecated_primary2: string
  deprecated_primary3: string
  deprecated_primaryText: string
  deprecated_secondary1: string
  deprecated_secondary2: string
  deprecated_background1: string
  deprecated_textColor: string
  deprecated_gray50: string
  deprecated_gray100: string
  deprecated_gray200: string
  deprecated_gray400: string
  deprecated_gray600: string
  deprecated_paleBlue: string
  deprecated_blue: string
  deprecated_green: string
  deprecated_pink: string
  deprecated_purple: string
  deprecated_orange: string
  deprecated_paleOrange: string
  deprecated_red: string
  deprecated_yellow: string
  deprecated_success: string
  deprecated_warning: string
  deprecated_error: string

  neutralBackground: string
  neutralSurface: string
  neutralContainer: string
  neutralAction: string
  neutralOutline: string
  neutralTextPrimary: string
  neutralTextSecondary: string
  neutralTextTertiary: string
  accentBackgroundAction: string
  accentBackgroundActionSoft: string
  accentBackgroundActive: string
  accentBackgroundSuccess: string
  accentBackgroundWarning: string
  accentBackgroundFailure: string
  accentText1: string
  accentText2: string
  accentText3: string

  white: string
  black: string
  none: string

  chain_1: string
  chain_3: string
  chain_4: string
  chain_5: string
  chain_10: string
  chain_137: string
  chain_42: string
  chain_69: string
  chain_42161: string
  chain_421611: string
  chain_80001: string
}

export const colorsLight: Palette = {
  deprecated_primary1: colors.pink400,
  deprecated_primary2: colors.pink300,
  deprecated_primary3: colors.pink200,
  deprecated_primaryText: colors.pink400,
  deprecated_secondary1: colors.pink100,
  deprecated_secondary2: colors.pink50,
  deprecated_background1: colors.gray50,
  deprecated_textColor: colors.gray900,
  deprecated_gray50: colors.gray50,
  deprecated_gray100: colors.gray100,
  deprecated_gray200: colors.gray200,
  deprecated_gray400: colors.gray400,
  deprecated_gray600: colors.gray600,
  deprecated_paleBlue: colors.blue50,
  deprecated_blue: colors.blue400,
  deprecated_green: colors.green400,
  deprecated_pink: colors.pink400,
  deprecated_purple: colors.pink400,
  deprecated_orange: colors.red400,
  deprecated_paleOrange: colors.red50,
  deprecated_red: colors.red400,
  deprecated_yellow: colors.yellow200,
  deprecated_success: colors.green400,
  deprecated_warning: colors.yellow200,
  deprecated_error: colors.red400,
  none: 'transparent',

  neutralBackground: colors.white,
  neutralSurface: colors.gray50,
  neutralContainer: colors.gray100,
  neutralAction: colors.gray200,
  neutralOutline: colors.gray300,
  neutralTextPrimary: colors.gray900,
  neutralTextSecondary: colors.gray500,
  neutralTextTertiary: colors.gray400,
  accentBackgroundAction: colors.pink400,
  accentBackgroundActionSoft: colors.pink100,
  accentBackgroundActive: colors.blue400,
  accentBackgroundSuccess: colors.green400,
  accentBackgroundWarning: colors.yellow200,
  accentBackgroundFailure: colors.red400,
  accentText1: opacify(80, colors.black),
  accentText2: opacify(60, colors.black),
  accentText3: opacify(24, colors.black),

  white: colors.white,
  black: colors.black,

  chain_1: colors.networkEthereum,
  chain_3: colors.yellow400,
  chain_4: colors.pink400,
  chain_5: colors.green400,
  chain_10: colors.networkOptimism,
  chain_137: colors.networkPolygon,
  chain_42: colors.networkArbitrum,
  chain_69: colors.networkOptimism,
  chain_42161: colors.networkEthereum,
  chain_421611: colors.networkEthereum,
  chain_80001: colors.networkPolygon,
}

export const colorsDark: Palette = {
  deprecated_primary1: colors.blue400,
  deprecated_primary2: colors.blue300,
  deprecated_primary3: colors.blue200,
  deprecated_primaryText: colors.blue400,
  deprecated_secondary1: colors.blue700,
  deprecated_secondary2: colors.blue800,
  deprecated_background1: colors.gray900,
  deprecated_textColor: colors.white,
  deprecated_gray50: colors.gray600,
  deprecated_gray100: colors.gray400,
  deprecated_gray200: colors.gray200,
  deprecated_gray400: colors.gray100,
  deprecated_gray600: colors.gray50,
  deprecated_paleBlue: colors.blue800,
  deprecated_blue: colors.blue400,
  deprecated_green: colors.green400,
  deprecated_pink: colors.pink400,
  deprecated_purple: colors.pink400,
  deprecated_orange: colors.red400,
  deprecated_paleOrange: colors.red50,
  deprecated_red: colors.red400,
  deprecated_yellow: colors.yellow200,
  deprecated_success: colors.green400,
  deprecated_warning: colors.yellow200,
  deprecated_error: colors.red400,

  // TODO: double-check these values
  neutralBackground: colors.white,
  neutralSurface: colors.gray50,
  neutralContainer: colors.gray100,
  neutralAction: colors.gray200,
  neutralOutline: colors.gray400,
  neutralTextPrimary: colors.white,
  neutralTextSecondary: colors.gray300,
  neutralTextTertiary: colors.gray400,
  accentBackgroundAction: colors.pink400,
  accentBackgroundActionSoft: colors.pink100,
  accentBackgroundActive: colors.blue400,
  accentBackgroundSuccess: colors.green400,
  accentBackgroundWarning: colors.yellow200,
  accentBackgroundFailure: colors.red400,
  // TODO: rgba(white) or rgba(black)
  accentText1: colors.white,
  accentText2: 'rgba(255, 255, 255, 0.72)',
  accentText3: 'rgba(255, 255, 255, 0.12)',

  white: colors.white,
  black: colors.black,
  none: 'transparent',

  chain_1: colors.networkEthereum,
  chain_3: colors.yellow400,
  chain_4: colors.pink400,
  chain_5: colors.green400,
  chain_10: colors.networkOptimism,
  chain_137: colors.networkPolygon,
  chain_42: colors.networkArbitrum,
  chain_69: colors.networkEthereum,
  chain_42161: colors.networkEthereum,
  chain_421611: colors.networkEthereum,
  chain_80001: colors.networkPolygon,
}
