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
  gray50: '#F5F6FC',
  gray100: '#E8ECFB',
  gray200: '#C9D0E7',
  gray300: '#99A1BD',
  gray400: '#7C85A2',
  gray500: '#5E6887',
  gray600: '#404963',
  gray700: '#293249',
  gray800: '#141B2B',
  gray900: '#0E111A',
  pink50: '#F9ECF1',
  pink100: '#FFD9E4',
  pink200: '#FBA4C0',
  pink300: '#FF6FA3',
  pink400: '#FB118E',
  pink500: '#C41969',
  pink600: '#8C0F49',
  pink700: '#55072A',
  pink800: '#350318',
  pink900: '#2B000B',
  pinkVibrant: '#F51A70',
  red50: '#FAECEA',
  red100: '#FED5CF',
  red200: '#FEA79B',
  red300: '#FD766B',
  red400: '#FA2B39',
  red500: '#C4292F',
  red600: '#891E20',
  red700: '#530F0F',
  red800: '#380A03',
  red900: '#240800',
  redVibrant: '#F14544',
  yellow50: '#F6F2D5',
  yellow100: '#DBBC19',
  yellow200: '#DBBC19',
  yellow300: '#BB9F13',
  yellow400: '#A08116',
  yellow500: '#866311',
  yellow600: '#5D4204',
  yellow700: '#3E2B04',
  yellow800: '#231902',
  yellow900: '#180F02',
  yellowVibrant: '#FAF40A',
  // TODO: add gold 50-900
  gold200: '#EEB317',
  goldVibrant: '#FEB239',
  green50: '#E3F3E6',
  green100: '#BFEECA',
  green200: '#76D191',
  green300: '#40B66B',
  green400: '#209853',
  green500: '#0B783E',
  green600: '#0C522A',
  green700: '#053117',
  green800: '#091F10',
  green900: '#09130B',
  greenVibrant: '#5CFE9D',
  blue50: '#EDEFF8',
  blue100: '#DEE1FF',
  blue200: '#ADBCFF',
  blue300: '#869EFF',
  blue400: '#4C82FB',
  blue500: '#1267D6',
  blue600: '#1D4294',
  blue700: '#09265E',
  blue800: '#0B193F',
  blue900: '#040E34',
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
  backgroundInteractive: Color
  backgroundFloating: Color
  backgroundModule: Color
  backgroundOutline: Color
  backgroundScrim: Color
  backgroundScrolledSurface: Color

  textPrimary: Color
  textSecondary: Color
  textTertiary: Color

  accentAction: Color
  accentActive: Color
  accentSuccess: Color
  accentWarning: Color
  accentFailure: Color
  accentCritical: Color

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

  chain_1: Color
  chain_3: Color
  chain_4: Color
  chain_5: Color
  chain_10: Color
  chain_137: Color
  chain_42: Color
  chain_420: Color
  chain_42161: Color
  chain_421611: Color
  chain_80001: Color
  chain_137_background: Color
  chain_10_background: Color
  chain_42161_background: Color

  shallowShadow: Color
  deepShadow: Color
  stateOverlayHover: Color
  stateOverlayPressed: Color
}

export const colorsLight: Palette = {
  userThemeColor: colors.magentaVibrant,

  backgroundBackdrop: colors.white,
  backgroundSurface: colors.white,
  backgroundModule: colors.gray50,
  backgroundInteractive: colors.gray100,
  backgroundFloating: opacify(8, colors.gray700),
  backgroundOutline: opacify(24, colors.gray500),
  backgroundScrim: opacify(60, colors.gray900),
  backgroundScrolledSurface: opacify(72, colors.white),

  textPrimary: colors.gray900,
  textSecondary: colors.gray500,
  textTertiary: colors.gray300,

  accentAction: colors.pink400,
  accentActive: colors.blue400,
  accentSuccess: colors.green300,
  accentWarning: colors.gold200,
  accentFailure: colors.red400,
  accentCritical: colors.red400,

  accentActionSoft: opacify(24, colors.pink400),
  accentActiveSoft: opacify(24, colors.blue400),
  accentSuccessSoft: opacify(24, colors.green400),
  accentWarningSoft: opacify(24, colors.gold200),
  accentFailureSoft: opacify(12, colors.red400),

  accentTextDarkPrimary: opacify(80, colors.gray900),
  accentTextDarkSecondary: opacify(60, colors.gray900),
  accentTextDarkTertiary: opacify(24, colors.gray900),

  accentTextLightPrimary: colors.gray50,
  accentTextLightSecondary: opacify(60, colors.gray50),
  accentTextLightTertiary: opacify(12, colors.gray50),

  white: colors.white,
  black: colors.black,

  chain_1: colors.networkEthereum,
  chain_3: colors.yellow400,
  chain_4: colors.pink400,
  chain_5: colors.green400,
  chain_10: colors.networkOptimism,
  chain_137: colors.networkPolygon,
  chain_42: colors.networkArbitrum,
  chain_420: colors.networkOptimism,
  chain_42161: colors.networkEthereum,
  chain_421611: colors.networkEthereum,
  chain_80001: colors.networkPolygon,
  chain_137_background: colors.purple900,
  chain_10_background: colors.red900,
  chain_42161_background: colors.blue900,

  deepShadow:
    '8px 12px 20px rgba(51, 53, 72, 0.04), 4px 6px 12px rgba(51, 53, 72, 0.02), 4px 4px 8px rgba(51, 53, 72, 0.04);',
  shallowShadow:
    '6px 6px 10px rgba(51, 53, 72, 0.01), 2px 2px 6px rgba(51, 53, 72, 0.02), 1px 2px 2px rgba(51, 53, 72, 0.02);',
  stateOverlayHover: opacify(8, colors.gray300),
  stateOverlayPressed: opacify(24, colors.gray200),
}

export const colorsDark: Palette = {
  userThemeColor: colors.magentaVibrant,

  backgroundBackdrop: colors.black,
  backgroundSurface: colors.gray900,
  backgroundModule: colors.gray800,
  backgroundInteractive: colors.gray700,
  backgroundFloating: opacify(12, colors.black),
  backgroundOutline: opacify(14, colors.gray300),
  backgroundScrim: opacify(72, colors.gray900),
  backgroundScrolledSurface: opacify(72, colors.gray900),

  textPrimary: colors.white,
  textSecondary: colors.gray300,
  textTertiary: colors.gray500,

  accentAction: colors.blue400,
  accentActive: colors.blue400,
  accentSuccess: colors.green200,
  accentWarning: colors.gold200,
  accentFailure: colors.red300,
  accentCritical: colors.red300,

  accentActionSoft: opacify(24, colors.blue400),
  accentActiveSoft: opacify(24, colors.blue400),
  accentSuccessSoft: opacify(24, colors.green400),
  accentWarningSoft: opacify(24, colors.gold200),
  accentFailureSoft: opacify(12, colors.red400),

  accentTextDarkPrimary: opacify(80, colors.gray900),
  accentTextDarkSecondary: opacify(60, colors.gray900),
  accentTextDarkTertiary: opacify(24, colors.gray900),

  accentTextLightPrimary: colors.gray50,
  accentTextLightSecondary: opacify(72, colors.gray50),
  accentTextLightTertiary: opacify(12, colors.gray50),

  white: colors.white,
  black: colors.black,

  chain_1: colors.networkEthereum,
  chain_3: colors.yellow400,
  chain_4: colors.pink400,
  chain_5: colors.green400,
  chain_10: colors.networkOptimism,
  chain_137: colors.networkPolygon,
  chain_42: colors.networkArbitrum,
  chain_420: colors.networkEthereum,
  chain_42161: colors.networkEthereum,
  chain_421611: colors.networkEthereum,
  chain_80001: colors.networkPolygon,
  chain_137_background: colors.purple900,
  chain_10_background: colors.red900,
  chain_42161_background: colors.blue900,

  deepShadow: '12px 16px 24px rgba(0, 0, 0, 0.24), 12px 8px 12px rgba(0, 0, 0, 0.24), 4px 4px 8px rgba(0, 0, 0, 0.32);',
  shallowShadow: '4px 4px 10px rgba(0, 0, 0, 0.24), 2px 2px 4px rgba(0, 0, 0, 0.12), 1px 2px 2px rgba(0, 0, 0, 0.12);',
  stateOverlayHover: opacify(8, colors.gray300),
  stateOverlayPressed: opacify(24, colors.gray200),
}
