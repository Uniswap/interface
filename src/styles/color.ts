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
  pinkVibrant: string
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
  redVibrant: string
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
  yellowVibrant: string
  gold200: string
  goldVibrant: string
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
  greenVibrant: string
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
  blueVibrant: string
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
  pinkVibrant: '#F51A70',
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
  redVibrant: '#F14544',
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
  yellowVibrant: '#FAF40A',
  // TODO: add gold 50-900
  gold200: '#EEB317',
  goldVibrant: '#FEB239',
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
  greenVibrant: '#5CFE9D',
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
  blueVibrant: '#587BFF',
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

  backgroundBackdrop: string
  backgroundSurface: string
  backgroundContainer: string
  backgroundAction: string
  backgroundOutline: string

  textPrimary: string
  textSecondary: string
  textTertiary: string

  accentAction: string
  accentActive: string
  accentSuccess: string
  accentWarning: string
  accentFailure: string

  accentActionSoft: string
  accentActiveSoft: string
  accentSuccessSoft: string
  accentWarningSoft: string
  accentFailureSoft: string

  accentTextDarkPrimary: string
  accentTextDarkSecondary: string
  accentTextDarkTertiary: string

  accentTextLightPrimary: string
  accentTextLightSecondary: string
  accentTextLightTertiary: string

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

  backgroundBackdrop: colors.white,
  backgroundSurface: colors.gray50,
  backgroundContainer: opacify(8, colors.gray500),
  backgroundAction: colors.gray100,
  backgroundOutline: opacify(24, colors.gray500),

  textPrimary: colors.gray900,
  textSecondary: colors.gray500,
  textTertiary: colors.gray400,

  accentAction: colors.pink400,
  accentActive: colors.blue400,
  accentSuccess: colors.green400,
  accentWarning: colors.gold200,
  accentFailure: colors.red400,

  accentActionSoft: opacify(12, colors.pink400),
  accentActiveSoft: opacify(12, colors.blue400),
  accentSuccessSoft: opacify(12, colors.green400),
  accentWarningSoft: opacify(12, colors.gold200),
  accentFailureSoft: opacify(12, colors.red400),

  accentTextDarkPrimary: opacify(80, colors.black),
  accentTextDarkSecondary: opacify(60, colors.black),
  accentTextDarkTertiary: opacify(24, colors.black),

  accentTextLightPrimary: colors.white,
  accentTextLightSecondary: opacify(60, colors.white),
  accentTextLightTertiary: opacify(12, colors.white),

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

  backgroundBackdrop: colors.black,
  backgroundSurface: colors.gray900,
  backgroundContainer: opacify(8, colors.gray300),
  backgroundAction: colors.gray700,
  backgroundOutline: opacify(24, colors.gray300),

  textPrimary: colors.white,
  textSecondary: colors.gray300,
  textTertiary: colors.gray400,

  accentAction: colors.blue400,
  accentActive: colors.blue400,
  accentSuccess: colors.greenVibrant,
  accentWarning: colors.gold200,
  accentFailure: colors.red400,

  accentActionSoft: opacify(12, colors.blue400),
  accentActiveSoft: opacify(12, colors.blue400),
  accentSuccessSoft: opacify(12, colors.green400),
  accentWarningSoft: opacify(12, colors.gold200),
  accentFailureSoft: opacify(12, colors.red400),

  // TODO: rgba(white) or rgba(black)

  accentTextDarkPrimary: opacify(80, colors.black),
  accentTextDarkSecondary: opacify(60, colors.black),
  accentTextDarkTertiary: opacify(24, colors.black),

  accentTextLightPrimary: colors.white,
  accentTextLightSecondary: opacify(72, colors.white),
  accentTextLightTertiary: opacify(12, colors.white),

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
