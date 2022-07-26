// Based mostly on https://github.com/Uniswap/interface/blob/main/src/theme/index.tsx

import { Color } from './styled'
import { opacify } from './utils'

export interface GlobalPalette {
  white: Color
  black: Color
  gray50: Color
  gray100: Color
  gray200: Color
  gray300: Color
  gray400: Color
  gray500: Color
  gray600: Color
  gray700: Color
  gray800: Color
  gray900: Color
  pink50: Color
  pink100: Color
  pink200: Color
  pink300: Color
  pink400: Color
  pink500: Color
  pink600: Color
  pink700: Color
  pink800: Color
  pink900: Color
  pinkVibrant: Color
  red50: Color
  red100: Color
  red200: Color
  red300: Color
  red400: Color
  red500: Color
  red600: Color
  red700: Color
  red800: Color
  red900: Color
  redVibrant: Color
  yellow50: Color
  yellow100: Color
  yellow200: Color
  yellow300: Color
  yellow400: Color
  yellow500: Color
  yellow600: Color
  yellow700: Color
  yellow800: Color
  yellow900: Color
  yellowVibrant: Color
  gold200: Color
  goldVibrant: Color
  green50: Color
  green100: Color
  green200: Color
  green300: Color
  green400: Color
  green500: Color
  green600: Color
  green700: Color
  green800: Color
  green900: Color
  greenVibrant: Color
  blue50: Color
  blue100: Color
  blue200: Color
  blue300: Color
  blue400: Color
  blue500: Color
  blue600: Color
  blue700: Color
  blue800: Color
  blue900: Color
  blueVibrant: Color
  magentaVibrant: Color
  purple900: Color
  networkEthereum: Color
  networkOptimism: Color
  networkOptimismSoft: Color
  networkPolygon: Color
  networkArbitrum: Color
  networkPolygonSoft: Color
  networkEthereumSoft: Color
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
  // TODO: add magenta 50-900
  magentaVibrant: '#FC72FF',
  purple900: '#1C0337',
  // TODO: add all other vibrant variations
  networkEthereum: '#627EEA',
  networkOptimism: '#FF0420',
  networkOptimismSoft: 'rgba(255, 4, 32, 0.16)',
  networkPolygon: '#A457FF',
  networkArbitrum: '#28A0F0',
  networkPolygonSoft: 'rgba(164, 87, 255, 0.16)',
  networkEthereumSoft: 'rgba(98, 126, 234, 0.16)',
}

export interface Palette {
  userThemeColor: Color

  backgroundBackdrop: Color
  backgroundSurface: Color
  backgroundContainer: Color
  backgroundAction: Color
  backgroundOutline: Color
  backgroundScrim: Color

  textPrimary: Color
  textSecondary: Color
  textTertiary: Color

  accentAction: Color
  accentActive: Color
  accentSuccess: Color
  accentWarning: Color
  accentFailure: Color

  accentActionSoft: Color
  accentActiveSoft: Color
  accentSuccessSoft: Color
  accentWarningSoft: Color
  accentFailureSoft: Color

  accentTextDarkPrimary: Color
  accentTextDarkSecondary: Color
  accentTextDarkTertiary: Color

  accentTextLightPrimary: Color
  accentTextLightSecondary: Color
  accentTextLightTertiary: Color

  white: Color
  black: Color
  none: Color

  chain_1: Color
  chain_3: Color
  chain_4: Color
  chain_5: Color
  chain_10: Color
  chain_137: Color
  chain_42: Color
  chain_69: Color
  chain_42161: Color
  chain_421611: Color
  chain_80001: Color
  chain_137_background: Color
  chain_10_background: Color
  chain_42161_background: Color

  flyoutDropShadow: Color
}

export const colorsLight: Palette = {
  userThemeColor: colors.magentaVibrant,

  none: 'transparent',

  backgroundBackdrop: colors.white,
  backgroundSurface: colors.gray50,
  backgroundContainer: opacify(8, colors.gray500),
  backgroundAction: colors.gray100,
  backgroundOutline: opacify(24, colors.gray500),
  backgroundScrim: opacify(72, colors.white),

  textPrimary: colors.gray900,
  textSecondary: colors.gray500,
  textTertiary: colors.gray300,

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
  chain_137_background: colors.purple900,
  chain_10_background: colors.red900,
  chain_42161_background: colors.blue900,

  flyoutDropShadow: colors.black,
}

export const colorsDark: Palette = {
  userThemeColor: colors.magentaVibrant,

  backgroundBackdrop: colors.black,
  backgroundSurface: colors.gray900,
  backgroundContainer: opacify(8, colors.gray300),
  backgroundAction: colors.gray700,
  backgroundOutline: opacify(24, colors.gray300),
  backgroundScrim: opacify(72, colors.black),

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
  chain_137_background: colors.purple900,
  chain_10_background: colors.red900,
  chain_42161_background: colors.blue900,

  flyoutDropShadow: colors.black,
}
