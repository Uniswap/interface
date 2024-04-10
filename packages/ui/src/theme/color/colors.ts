import { opacify } from 'ui/src/theme/color/utils'

export const colors = {
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
  networkEthereum: '#627EEA',
  networkOptimism: '#FF0420',
  networkPolygon: '#A457FF',
  networkArbitrum: '#28A0F0',
  networkBsc: '#F0B90B',
  networkBase: '#0052FF',
  fiatOnRampBanner: '#FB36D0',
}

// TODO: map named colors to new Spore colors
// TODO: consolidate Spore colors and raw color palette

const sporeLight = {
  sporeWhite: '#FFFFFF',
  sporeBlack: '#000000',

  surface1: '#FFFFFF',
  surface2: '#F9F9F9',
  surface3: '#2222220D', //0D = 5%
  surface4: '#FFFFFFA3', //A3 = 64%
  surface5: '#0000000A', //0A = 4%

  scrim: '#00000099', //99 = 40%,

  neutral1: '#222222',
  neutral2: '#7D7D7D',
  neutral3: '#CECECE',

  accent1: '#FC72FF',
  accent2: '#FFEFFF',

  accentSoft: '#FC72FF33', //33 = 20%

  statusActive: '#236EFF',
  statusSuccess: '#40B66B',
  statusCritical: '#FF5F52',
}

const sporeDark = {
  sporeWhite: '#FFFFFF',
  sporeBlack: '#000000',

  surface1: '#131313',
  surface2: '#1B1B1B',
  surface3: '#FFFFFF1F', //1F = 12%
  surface4: '#FFFFFF33', //33 = 20%
  surface5: '#0000000A', //0A = 4%

  scrim: '#00000099', //99 = 40%

  neutral1: '#FFFFFF',
  neutral2: '#9B9B9B',
  neutral3: '#5E5E5E',

  accent1: '#FC72FF',
  accent2: '#311C31',

  accentSoft: '#FC72FF33', //33 = 20%

  statusActive: '#236EFF',
  statusSuccess: '#40B66B',
  statusCritical: '#FF5F52',
}

export const colorsLight = {
  none: 'transparent',

  sporeWhite: sporeLight.sporeWhite,
  sporeBlack: sporeLight.sporeBlack,

  surface1: sporeLight.surface1,
  surface2: sporeLight.surface2,
  surface3: sporeLight.surface3,
  surface4: sporeLight.surface4,
  surface5: sporeLight.surface5,

  scrim: sporeLight.scrim,
  // TODO: Revisit Spore colors
  DEP_scrimSoft: opacify(50, colors.gray150),

  neutral1: sporeLight.neutral1,
  neutral2: sporeLight.neutral2,
  neutral3: sporeLight.neutral3,

  accent1: sporeLight.accent1,
  accent2: sporeLight.accent2,

  accentSoft: sporeLight.accentSoft,

  statusSuccess: sporeLight.statusSuccess,
  statusCritical: sporeLight.statusCritical,

  DEP_backgroundBranded: '#FCF7FF',
  DEP_backgroundActionButton: colors.magenta50,
  DEP_backgroundOverlay: opacify(60, colors.white),

  DEP_accentWarning: colors.goldVibrant,

  DEP_accentBranded: colors.magentaVibrant,
  DEP_shadowBranded: colors.magentaVibrant,

  DEP_accentSuccessSoft: opacify(24, colors.green300),
  DEP_accentWarningSoft: opacify(24, colors.goldVibrant),
  DEP_accentCriticalSoft: opacify(12, colors.red400),

  DEP_blue300: colors.blue300,
  DEP_brandedAccentSoft: colors.magenta100,
  DEP_magentaDark: opacify(12, colors.magentaVibrant),

  DEP_fiatBanner: colors.fiatOnRampBanner,

  chain_1: colors.networkEthereum,
  chain_3: colors.yellow400,
  chain_4: colors.pink400,
  chain_5: colors.green400,
  chain_10: colors.networkOptimism,
  chain_137: colors.networkPolygon,
  chain_42161: colors.networkArbitrum,
  chain_80001: colors.networkPolygon,
  chain_8453: colors.networkBase,
  chain_56: colors.networkBsc,
}

export type ColorKeys = keyof typeof colorsLight

export const colorsDark = {
  none: 'transparent',

  sporeWhite: sporeDark.sporeWhite,
  sporeBlack: sporeDark.sporeBlack,

  surface1: sporeDark.surface1,
  surface2: sporeDark.surface2,
  surface3: sporeDark.surface3,
  surface4: sporeDark.surface4,
  surface5: sporeDark.surface5,

  scrim: sporeDark.scrim,
  // TODO: Revisit Spore colors
  DEP_scrimSoft: opacify(50, colors.gray750),

  neutral1: sporeDark.neutral1,
  neutral2: sporeDark.neutral2,
  neutral3: sporeDark.neutral3,

  accent1: sporeDark.accent1,
  accent2: sporeDark.accent2,

  accentSoft: sporeDark.accentSoft,

  statusSuccess: sporeDark.statusSuccess,
  statusCritical: sporeDark.statusCritical,

  DEP_backgroundBranded: '#100D1C',
  DEP_backgroundActionButton: opacify(12, colors.magentaVibrant),
  DEP_backgroundOverlay: opacify(10, colors.white),

  DEP_accentWarning: colors.goldVibrant,

  DEP_accentBranded: colors.magentaVibrant,
  // TODO(MOB-160): accommodate one-off color in cleaner way
  DEP_shadowBranded: '#B60ACF',

  DEP_accentSuccessSoft: opacify(24, colors.green400),
  DEP_accentWarningSoft: opacify(24, colors.gold200),
  DEP_accentCriticalSoft: opacify(12, colors.red400),

  DEP_blue300: colors.blue300,
  DEP_brandedAccentSoft: '#46244F', // git blame Chelsy
  DEP_magentaDark: opacify(12, colors.magentaVibrant),

  DEP_fiatBanner: colors.fiatOnRampBanner,

  chain_1: colors.networkEthereum,
  chain_3: colors.yellow400,
  chain_4: colors.pink400,
  chain_5: colors.green400,
  chain_10: colors.networkOptimism,
  chain_137: colors.networkPolygon,
  chain_42161: colors.networkArbitrum,
  chain_80001: colors.networkPolygon,
  chain_8453: colors.networkBase,
  chain_56: colors.networkBsc,
}
