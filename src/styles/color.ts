// allow long constants file
/* eslint-disable max-lines */
// Based mostly on https://github.com/Uniswap/interface/blob/main/src/theme/index.tsx

import { opacify } from 'src/utils/colors'

export interface GlobalPalette {
  white: string
  black: string
  gray50: string
  gray100: string
  gray150: string
  gray200: string
  gray250: string
  gray300: string
  gray350: string
  gray400: string
  gray450: string
  gray500: string
  gray550: string
  gray600: string
  gray650: string
  gray700: string
  gray750: string
  gray800: string
  gray850: string
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
  gray50: '#F5F6FC',
  gray100: '#E8ECFB',
  gray150: '#D2D9EE',
  gray200: '#B8C0DC',
  gray250: '#A6AFCA',
  gray300: '#98A1C0',
  gray350: '#888FAB',
  gray400: '#7780A0',
  gray450: '#6B7594',
  gray500: '#5D6785',
  gray550: '#505A78',
  gray600: '#404A67',
  gray650: '#333D59',
  gray700: '#293249',
  gray750: '#1B2236',
  gray800: '#131A2A',
  gray850: '#0E1524',
  gray900: '#0D111C',
  pink50: '#FFF2F7',
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
  red50: '#FEF0EE',
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
  yellow50: '#FEF8C4',
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
  gold50: '#FFF5E8',
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
  green50: '#EDFDF0',
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
  blue50: '#F3F5FE',
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
  lime50: '#F2FEDB',
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
  orange50: '#FEEDE5',
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
  magenta50: '#FFF1FE',
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
  violet50: '#F1EFFE',
  violet100: '#E2DEFD',
  violet200: '#BDB8FA',
  violet300: '#9D99F5',
  violet400: '#7A7BEB',
  violet500: '#515EDC',
  violet600: '#343F9E',
  violet700: '#232969',
  violet800: '#121643',
  violet900: '#0E0D30',
  violetVibrant: '#5065FD',
  cyan50: '#D6F5FE',
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
  slate50: '#F1FCEF',
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
  networkEthereum: '#393939',
  networkEthereumSoft: opacify(12, '#393939'),
  networkOptimism: '#FA2B39',
  networkOptimismSoft: opacify(12, '#FA2B39'),
  networkPolygon: '#a26af3',
  networkPolygonSoft: opacify(12, '#A26AF3'),
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

  background0: string
  background1: string
  background2: string
  background3: string
  backgroundOutline: string
  backgroundScrim: string
  backgroundBranded: string
  backgroundOverlay: string
  backgroundActionButton: string

  textPrimary: string
  textSecondary: string
  textTertiary: string

  accentAction: string
  accentActive: string
  accentSuccess: string
  accentWarning: string
  accentCritical: string

  accentBranded: string
  shadowBranded: string

  accentActionSoft: string
  accentActiveSoft: string
  accentSuccessSoft: string
  accentWarningSoft: string
  accentCriticalSoft: string

  textOnBrightPrimary: string
  textOnBrightSecondary: string
  textOnBrightTertiary: string

  textOnDimPrimary: string
  textOnDimSecondary: string
  textOnDimTertiary: string

  white: string
  black: string
  none: string
  blue300: string
  brandedAccentSoft: string
  magentaVibrant: string
  magentaDark: string

  chain_1: string
  chain_3: string
  chain_4: string
  chain_5: string
  chain_10: string
  chain_137: string
  chain_42161: string
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

  background0: colors.white,
  background1: colors.white,
  background2: colors.gray50,
  background3: colors.gray100,
  backgroundOutline: colors.gray150,
  backgroundScrim: opacify(50, colors.gray150),
  backgroundBranded: '#FCF7FF',
  backgroundActionButton: colors.magenta50,
  backgroundOverlay: opacify(60, colors.white),

  textPrimary: colors.gray850,
  textSecondary: colors.gray500,
  textTertiary: colors.gray350,

  accentAction: colors.magentaVibrant,
  accentActive: colors.blue400,
  accentSuccess: colors.green300,
  accentWarning: colors.goldVibrant,
  accentCritical: colors.red400,

  accentBranded: colors.magentaVibrant,
  shadowBranded: colors.magentaVibrant,

  accentActionSoft: opacify(12, colors.magentaVibrant),
  accentActiveSoft: opacify(24, colors.blue400),
  accentSuccessSoft: opacify(24, colors.green300),
  accentWarningSoft: opacify(24, colors.goldVibrant),
  accentCriticalSoft: opacify(12, colors.red400),

  textOnBrightPrimary: colors.white,
  textOnBrightSecondary: colors.gray50,
  textOnBrightTertiary: opacify(50, colors.white),

  textOnDimPrimary: colors.gray900,
  textOnDimSecondary: colors.gray800,
  textOnDimTertiary: opacify(45, colors.gray900),

  white: colors.white,
  black: colors.black,
  blue300: colors.blue300,
  brandedAccentSoft: colors.magenta100,
  magentaVibrant: colors.magentaVibrant,
  magentaDark: opacify(12, colors.magentaVibrant),

  chain_1: colors.networkEthereum,
  chain_3: colors.yellow400,
  chain_4: colors.pink400,
  chain_5: colors.green400,
  chain_10: colors.networkOptimism,
  chain_137: colors.networkPolygon,
  chain_42161: colors.networkArbitrum,
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

  background0: colors.black,
  background1: colors.gray900,
  background2: colors.gray800,
  background3: colors.gray700,
  backgroundOutline: colors.gray750,
  backgroundScrim: opacify(50, colors.gray750),
  backgroundBranded: '#100D1C',
  backgroundActionButton: opacify(12, colors.magentaVibrant),
  backgroundOverlay: opacify(10, colors.white),

  textPrimary: colors.white,
  textSecondary: colors.gray200,
  textTertiary: colors.gray400,

  accentAction: colors.magentaVibrant,
  accentActive: colors.blue400,
  accentSuccess: colors.green300,
  accentWarning: colors.goldVibrant,
  accentCritical: colors.red400,

  accentBranded: colors.magentaVibrant,
  // TODO(MOB-3591): accommodate one-off color in cleaner way
  shadowBranded: '#B60ACF',

  accentActionSoft: opacify(24, colors.magentaVibrant),
  accentActiveSoft: opacify(24, colors.blue400),
  accentSuccessSoft: opacify(24, colors.green400),
  accentWarningSoft: opacify(24, colors.gold200),
  accentCriticalSoft: opacify(12, colors.red400),

  textOnBrightPrimary: colors.white,
  textOnBrightSecondary: colors.gray50,
  textOnBrightTertiary: opacify(50, colors.white),

  textOnDimPrimary: colors.gray900,
  textOnDimSecondary: colors.gray800,
  textOnDimTertiary: opacify(45, colors.gray900),

  white: colors.white,
  black: colors.black,
  none: 'transparent',
  blue300: colors.blue300,
  brandedAccentSoft: '#46244F', // git blame Chelsy
  magentaVibrant: colors.magentaVibrant,
  magentaDark: opacify(12, colors.magentaVibrant),

  chain_1: colors.networkEthereum,
  chain_3: colors.yellow400,
  chain_4: colors.pink400,
  chain_5: colors.green400,
  chain_10: colors.networkOptimism,
  chain_137: colors.networkPolygon,
  chain_42161: colors.networkArbitrum,
  chain_80001: colors.networkPolygon,
}
