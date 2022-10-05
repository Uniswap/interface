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
  gold50: string
  gold100: string
  gold200: string
  gold300: string
  gold400: string
  gold500: string
  gold600: string
  gold700: string
  gold800: string
  gold900: string
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
  lime50: string
  lime100: string
  lime200: string
  lime300: string
  lime400: string
  lime500: string
  lime600: string
  lime700: string
  lime800: string
  lime900: string
  limeVibrant: string
  orange50: string
  orange100: string
  orange200: string
  orange300: string
  orange400: string
  orange500: string
  orange600: string
  orange700: string
  orange800: string
  orange900: string
  orangeVibrant: string
  magenta50: string
  magenta100: string
  magenta200: string
  magenta300: string
  magenta400: string
  magenta500: string
  magenta600: string
  magenta700: string
  magenta800: string
  magenta900: string
  magentaVibrant: string
  violet50: string
  violet100: string
  violet200: string
  violet300: string
  violet400: string
  violet500: string
  violet600: string
  violet700: string
  violet800: string
  violet900: string
  violetVibrant: string
  cyan50: string
  cyan100: string
  cyan200: string
  cyan300: string
  cyan400: string
  cyan500: string
  cyan600: string
  cyan700: string
  cyan800: string
  cyan900: string
  cyanVibrant: string
  slate50: string
  slate100: string
  slate200: string
  slate300: string
  slate400: string
  slate500: string
  slate600: string
  slate700: string
  slate800: string
  slate900: string
  purple50: string
  purple100: string
  purple200: string
  purple300: string
  purple400: string
  purple500: string
  purple600: string
  purple700: string
  purple800: string
  purple900: string
  purpleVibrant: string
  slateVibrant: string
  networkEthereum: string
  networkEthereumSoft: string
  networkOptimism: string
  networkOptimismSoft: string
  networkPolygon: string
  networkPolygonSoft: string
  networkArbitrum: string
  networkArbitrumSoft: string
}

export const colors: GlobalPalette = {
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#f5f6fc',
  gray100: '#e8ecfb',
  gray200: '#c9d0e7',
  gray300: '#99A1BD',
  gray400: '#7C85A2',
  gray500: '#5E6887',
  gray600: '#404963',
  gray700: '#293249',
  gray800: '#141B2B',
  gray900: '#0E111A',
  pink50: '#fff2f7',
  pink100: '#FFD9E4',
  pink200: '#FBA4C0',
  pink300: '#FF6FA3',
  pink400: '#FB118E',
  pink500: '#C41A69',
  pink600: '#8C0F49',
  pink700: '#55072A',
  pink800: '#39061B',
  pink900: '#2B000B',
  pinkVibrant: '#F51A70',
  red50: '#fef0ee',
  red100: '#FED5CF',
  red200: '#FEA79B',
  red300: '#FD766B',
  red400: '#FA2B39',
  red500: '#C4292F',
  red600: '#891E20',
  red700: '#530F10',
  red800: '#380A03',
  red900: '#240800',
  redVibrant: '#F14544',
  yellow50: '#fef8c4',
  yellow100: '#F0E49A',
  yellow200: '#DBBC19',
  yellow300: '#BB9F13',
  yellow400: '#A08116',
  yellow500: '#866311',
  yellow600: '#5D4204',
  yellow700: '#3E2B04',
  yellow800: '#231902',
  yellow900: '#180F02',
  yellowVibrant: '#FAF40A',
  gold50: '#fff5e8',
  gold100: '#F8DEB6',
  gold200: '#EEB317',
  gold300: '#DB900B',
  gold400: '#B17900',
  gold500: '#905C10',
  gold600: '#643F07',
  gold700: '#3F2208',
  gold800: '#29160F',
  gold900: '#161007',
  goldVibrant: '#FEB239',
  green50: '#edfdf0',
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
  blue50: '#f3f5fe',
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
  lime50: '#f2fedb',
  lime100: '#D3EBA3',
  lime200: '#9BCD46',
  lime300: '#7BB10C',
  lime400: '#649205',
  lime500: '#527318',
  lime600: '#344F00',
  lime700: '#233401',
  lime800: '#171D00',
  lime900: '#0E1300',
  limeVibrant: '#B1F13C',
  orange50: '#feede5',
  orange100: '#FCD9C8',
  orange200: '#FBAA7F',
  orange300: '#F67E3E',
  orange400: '#DC5B14',
  orange500: '#AF460A',
  orange600: '#76330F',
  orange700: '#4D220B',
  orange800: '#2A1505',
  orange900: '#1C0E03',
  orangeVibrant: '#FF6F1E',
  magenta50: '#fff1fe',
  magenta100: '#FAD8F8',
  magenta200: '#F5A1F5',
  magenta300: '#F06DF3',
  magenta400: '#DC39E3',
  magenta500: '#AF2EB4',
  magenta600: '#7A1C7D',
  magenta700: '#550D56',
  magenta800: '#330733',
  magenta900: '#250225',
  magentaVibrant: '#FC72FF',
  violet50: '#f1effe',
  violet100: '#E2DEFD',
  violet200: '#BDB8FA',
  violet300: '#9D99F5',
  violet400: '#7A7BEB',
  violet500: '#515EDC',
  violet600: '#343F9E',
  violet700: '#121643',
  violet800: '#0B193F',
  violet900: '#0E0D30',
  violetVibrant: '#5065FD',
  cyan50: '#d6f5fe',
  cyan100: '#B0EDFE',
  cyan200: '#63CDE8',
  cyan300: '#2FB0CC',
  cyan400: '#2092AB',
  cyan500: '#117489',
  cyan600: '#014F5F',
  cyan700: '#003540',
  cyan800: '#011E26',
  cyan900: '#011418',
  cyanVibrant: '#36DBFF',
  slate50: '#f1fcef',
  slate100: '#DAE6D8',
  slate200: '#B8C3B7',
  slate300: '#9AA498',
  slate400: '#7E887D',
  slate500: '#646B62',
  slate600: '#434942',
  slate700: '#2C302C',
  slate800: '#181B18',
  slate900: '#0F120E',
  slateVibrant: '#7E887D',
  purple50: '#f8f1ff',
  purple100: '#ecddfe',
  purple200: '#d0b2f3',
  purple300: '#b98ef4',
  purple400: '#a26af3',
  purple500: '#8440f2',
  purple600: '#5213c2',
  purple700: '#3a0a8f',
  purple800: '#22055b',
  purple900: '#1c0337',
  purpleVibrant: '#6100ff',
  networkEthereum: '#515EDC',
  networkEthereumSoft: opacify(12, '#515EDC'),
  networkOptimism: '#FA2B39',
  networkOptimismSoft: opacify(12, '#FA2B39'),
  networkPolygon: '#a26af3',
  networkPolygonSoft: opacify(12, '#a26af3'),
  networkArbitrum: '#28A0F0',
  networkArbitrumSoft: opacify(12, '#28A0F0'),
}

export interface Palette {
  userThemeColor: string
  userThemeMagenta: string
  userThemeViolet: string
  userThemeOrange: string
  userThemeLime: string
  userThemeCyan: string
  userThemeSlate: string

  backgroundBackdrop: string
  backgroundSurface: string
  backgroundContainer: string
  backgroundAction: string
  backgroundInteractive: string
  backgroundOutline: string
  backgroundScrim: string

  textPrimary: string
  textSecondary: string
  textTertiary: string

  accentAction: string
  accentActive: string
  accentSuccess: string
  accentWarning: string
  // TODO: update to accentCritical
  accentFailure: string
  accentBranded: string

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
  blue300: string
  magentaVibrant: string

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
  userThemeColor: colors.magentaVibrant,
  userThemeMagenta: colors.magentaVibrant,
  userThemeViolet: colors.violetVibrant,
  userThemeOrange: colors.orangeVibrant,
  userThemeLime: colors.limeVibrant,
  userThemeCyan: colors.cyanVibrant,
  userThemeSlate: colors.slateVibrant,

  none: 'transparent',

  backgroundBackdrop: colors.white,
  backgroundSurface: colors.white,
  backgroundContainer: colors.gray50,
  backgroundAction: colors.gray100,
  backgroundInteractive: colors.gray100,
  backgroundOutline: opacify(24, colors.gray500),
  backgroundScrim: opacify(60, colors.gray900),

  textPrimary: colors.gray900,
  textSecondary: colors.gray500,
  textTertiary: colors.gray300,

  accentAction: colors.pink400,
  accentActive: colors.blue400,
  accentSuccess: colors.green300,
  accentWarning: colors.gold400,
  accentFailure: colors.red400,
  accentBranded: colors.pink200,

  accentActionSoft: opacify(12, colors.pink400),
  accentActiveSoft: opacify(24, colors.blue400),
  accentSuccessSoft: opacify(24, colors.green300),
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
  blue300: colors.blue300,
  magentaVibrant: colors.magentaVibrant,

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
  userThemeColor: colors.magentaVibrant,
  userThemeMagenta: colors.magentaVibrant,
  userThemeViolet: colors.violetVibrant,
  userThemeOrange: colors.orangeVibrant,
  userThemeLime: colors.limeVibrant,
  userThemeCyan: colors.cyanVibrant,
  userThemeSlate: colors.slateVibrant,

  backgroundBackdrop: colors.black,
  backgroundSurface: colors.gray900,
  backgroundContainer: colors.gray800,
  backgroundAction: colors.gray700,
  backgroundInteractive: colors.gray700,
  backgroundOutline: opacify(24, colors.gray300),
  backgroundScrim: opacify(72, colors.gray900),

  textPrimary: colors.white,
  textSecondary: colors.gray300,
  textTertiary: colors.gray500,

  accentAction: colors.blue400,
  accentActive: colors.blue400,
  accentSuccess: colors.green200,
  accentWarning: colors.gold200,
  accentFailure: colors.red300,
  accentBranded: colors.pink200,

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
  none: 'transparent',
  blue300: colors.blue300,
  magentaVibrant: colors.magentaVibrant,

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
