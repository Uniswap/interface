// Based mostly on https://github.com/Uniswap/interface/blob/main/src/theme/index.tsx
import { opacify } from './utils'

export const colors = {
  // Black & white
  white: '#FFFFFF',
  black: '#000000',

  // White Alpha
  whiteAlpha50: '#FFFFFF0A',
  whiteAlpha100: '#FFFFFF0F',
  whiteAlpha200: '#FFFFFF14',
  whiteAlpha300: '#FFFFFF29',
  whiteAlpha400: '#FFFFFF3D',
  whiteAlpha500: '#FFFFFF5C',
  whiteAlpha600: '#FFFFFF7A',
  whiteAlpha700: '#FFFFFFA3',
  whiteAlpha800: '#FFFFFFCC',
  whiteAlpha900: '#FFFFFFEB',

  // Black Alpha
  blackAlpha50: '#0000000A',
  blackAlpha100: '#0000000F',
  blackAlpha200: '#00000014',
  blackAlpha300: '#00000029',
  blackAlpha400: '#0000003D',
  blackAlpha500: '#0000005C',
  blackAlpha600: '#0000007A',
  blackAlpha700: '#000000A3',
  blackAlpha800: '#000000CC',
  blackAlpha900: '#000000EB',

  // Gray
  gray50: '#F7FAFC',
  gray100: '#EDF2F7',
  gray200: '#E2E8F0',
  gray300: '#CBD5E0',
  gray400: '#A0AEC0',
  gray500: '#718096',
  gray600: '#4A5568',
  gray700: '#2D3748',
  gray800: '#1A202C',
  gray900: '#171923',

  bgDark: '#000913',

  deep: '#081120',
  input: '#0B172C',
  // old gray colors uniV3
  gray150: '#D2D9EE',
  gray250: '#A6AFCA',
  gray350: '#888FAB',
  gray450: '#6B7594',
  gray550: '#505A78',
  gray650: '#333D59',
  gray750: '#1B2236',
  gray850: '#0E1524',
  gray950: '#080B11',

  // Pink
  pink50: '#FFF5F7',
  pink100: '#FED7E2',
  pink200: '#FBB6CE',
  pink300: '#F687B3',
  pink400: '#ED64A6',
  pink500: '#D53F8C',
  pink600: '#B83280',
  pink700: '#97266D',
  pink800: '#702459',
  pink900: '#521B41',
  pinkVibrant: '#F51A70',

  // Red
  red50: '#FFF5F5',
  red100: '#FED7D7',
  red200: '#FEB2B2',
  red300: '#FC8181',
  red400: '#F56565',
  red500: '#E53E3E',
  red600: '#C53030',
  red700: '#9B2C2C',
  red800: '#822727',
  red900: '#63171B',

  // old red color uniV3
  redVibrant: '#F14544',

  // Yellow
  yellow50: '#FFFFF0',
  yellow100: '#FEFCBF',
  yellow200: '#FAF089',
  yellow300: '#F6E05E',
  yellow400: '#ECC94B',
  yellow500: '#D69E2E',
  yellow600: '#B7791F',
  yellow700: '#975A16',
  yellow800: '#744210',
  yellow900: '#5F370E',

  // old yellow color uniV3
  yellowVibrant: '#FAF40A',

  // Orange
  orange50: '#FFFAF0',
  orange100: '#FEEBCB',
  orange200: '#FBD38D',
  orange300: '#F6AD55',
  orange400: '#ED8936',
  orange500: '#DD6B20',
  orange600: '#C05621',
  orange700: '#9C4221',
  orange800: '#7B341E',
  orange900: '#652B19',

  // TODO: add gold 50-900
  gold200: '#EEB317',
  gold400: '#B17900',
  goldVibrant: '#FEB239',

  // Green
  green50: '#F0FFF4',
  green100: '#C6F6D5',
  green200: '#9AE6B4',
  green300: '#68D391',
  green400: '#48BB78',
  green500: '#38A169',
  green600: '#25855A',
  green700: '#276749',
  green800: '#22543D',
  green900: '#1C4532',

  // old green color uniV3
  greenVibrant: '#5CFE9D',

  // Teal
  teal50: '#E6FFFA',
  teal100: '#B2F5EA',
  teal200: '#81E6D9',
  teal300: '#4FD1C5',
  teal400: '#38B2AC',
  teal500: '#319795',
  teal600: '#2C7A7B',
  teal700: '#285E61',
  teal800: '#234E52',
  teal900: '#1D4044',

  // Blue
  blue50: '#EBF8FF',
  blue100: '#BEE3F8',
  blue200: '#90CDF4',
  blue300: '#63B3ED',
  blue400: '#4299E1',
  blue500: '#3182CE',
  blue600: '#2B6CB0',
  blue700: '#2C5282',
  blue800: '#2A4365',
  blue900: '#1A365D',

  blueButton: '#153D6F',

  // old Blue uniV3
  blueVibrant: '#587BFF',

  // cyan
  cyan50: '#EDFDFD',
  cyan100: '#C4F1F9',
  cyan200: '#9DECF9',
  cyan300: '#76E4F7',
  cyan400: '#0BC5EA',
  cyan500: '#00B5D8',
  cyan600: '#00A3C4',
  cyan700: '#0987A0',
  cyan800: '#086F83',
  cyan900: '#065666',

  cyanText: '#00D9EF',

  // purple
  purple50: '#FAF5FF',
  purple100: '#E9D8FD',
  purple200: '#D6BCFA',
  purple300: '#B794F4',
  purple400: '#9F7AEA',
  purple500: '#805AD5',
  purple600: '#6B46C1',
  purple700: '#553C9A',
  purple800: '#44337A',
  purple900: '#322659',

  // MainColors Pegasys
  purpleVibrantMain: '#8C15E8',
  purpleMain: '#665EE1',
  blueMain: '#3C8BDD',
  blueLightMain: '#56C0DA',
  cyanLightMain: '#67DBD8',
  cyanMain: '#19EDD0',

  darkGrayMain: '#262626',
  blackMain: '#1A1A1A',

  // TODO: add magenta 50-900
  magenta300: '#FD82FF',
  magentaVibrant: '#FC72FF',

  // TODO: add all other vibrant variations
  networkEthereum: '#627EEA',
  networkOptimism: '#FF0420',
  networkOptimismSoft: 'rgba(255, 4, 32, 0.16)',
  networkPolygon: '#A457FF',
  networkArbitrum: '#28A0F0',
  networkBsc: '#F0B90B',
  networkPolygonSoft: 'rgba(164, 87, 255, 0.16)',
  networkEthereumSoft: 'rgba(98, 126, 234, 0.16)',
  networkSyscoin: '#377DF5',
}

type Theme = typeof darkTheme

const commonTheme = {
  white: colors.white,
  black: colors.black,

  chain_1: colors.networkEthereum,
  chain_3: colors.yellow400,
  chain_4: colors.pink400,
  chain_5: colors.green400,
  chain_10: colors.networkOptimism,
  chain_137: colors.networkPolygon,
  chain_42: colors.networkArbitrum,
  chain_56: colors.networkBsc,
  chain_420: colors.networkOptimism,
  chain_42161: colors.networkArbitrum,
  chain_421613: colors.networkArbitrum,
  chain_80001: colors.networkPolygon,
  chain_137_background: colors.purple900,
  chain_10_background: colors.red900,
  chain_42161_background: colors.blue900,
  chain_56_background: colors.networkBsc,
  promotional: colors.magenta300,

  brandedGradient: 'linear-gradient(139.57deg, #FF79C9 4.35%, #FFB8E2 96.44%);',
  promotionalGradient: 'radial-gradient(101.8% 4091.31% at 0% 0%, #4673FA 0%, #9646FA 100%);',

  hoverState: opacify(24, colors.blue200),
  hoverDefault: opacify(8, colors.gray300),
}

export const darkTheme = {
  ...commonTheme,

  userThemeColor: colors.magentaVibrant,

  background: colors.bgDark,
  backgroundImage: 'radial-gradient(circle at center , #56BED8, #010101)',
  backgroundBackdrop: colors.gray950,
  backgroundSurface: colors.deep,
  backgroundModule: colors.input,
  backgroundInteractive: colors.gray700,
  backgroundFloating: opacify(12, colors.black),
  backgroundOutline: opacify(24, colors.gray300),
  backgroundScrim: opacify(72, colors.deep),
  backgroundScrolledSurface: opacify(72, colors.deep),
  backgroundBorderGradient: 'linear-gradient(312.16deg, rgba(86, 190, 216, 0.3) 30.76%, rgba(86, 190, 216, 0) 97.76%)',

  textPrimary: colors.white,
  textSecondary: colors.gray300,
  textTertiary: colors.gray500,

  accentAction: colors.blueButton,
  accentActive: colors.cyanText,
  accentSuccess: colors.green200,
  accentWarning: colors.gold200,
  accentFailure: colors.red300,
  accentCritical: colors.red300,

  accentActionSoft: opacify(24, colors.blueButton),
  accentActiveSoft: opacify(24, colors.cyanText),
  accentSuccessSoft: opacify(24, colors.green400),
  accentWarningSoft: opacify(24, colors.gold200),
  accentFailureSoft: opacify(12, colors.red300),

  accentTextDarkPrimary: opacify(80, colors.deep),
  accentTextDarkSecondary: opacify(60, colors.deep),
  accentTextDarkTertiary: opacify(24, colors.deep),

  accentTextLightPrimary: colors.gray50,
  accentTextLightSecondary: opacify(72, colors.gray50),
  accentTextLightTertiary: opacify(12, colors.gray50),

  deepShadow: '12px 16px 24px rgba(0, 0, 0, 0.24), 12px 8px 12px rgba(0, 0, 0, 0.24), 4px 4px 8px rgba(0, 0, 0, 0.32);',
  shallowShadow: '4px 4px 10px rgba(0, 0, 0, 0.24), 2px 2px 4px rgba(0, 0, 0, 0.12), 1px 2px 2px rgba(0, 0, 0, 0.12);',

  networkDefaultShadow: `0px 40px 120px ${opacify(16, colors.blue400)}`,

  stateOverlayHover: opacify(8, colors.gray300),
  stateOverlayPressed: opacify(24, colors.gray200),

  searchBackground: `rgba(255,255,255,0.07)`,
  searchOutline: `rgba(255,255,255,0.07)`,
}

export const lightTheme: Theme = {
  ...commonTheme,

  userThemeColor: colors.magentaVibrant,

  background: colors.gray100,
  backgroundImage: 'radial-gradient(ellipse at center, #68e1ffbe, #e6faff)',
  backgroundBackdrop: colors.white,
  backgroundSurface: colors.white,
  backgroundModule: colors.gray50,
  backgroundInteractive: colors.gray100,
  backgroundFloating: opacify(8, colors.gray700),
  backgroundOutline: colors.gray150,
  backgroundScrim: opacify(60, colors.gray900),
  backgroundScrolledSurface: opacify(72, colors.white),
  backgroundBorderGradient: 'linear-gradient(312.16deg, rgba(86, 190, 216, 0.3) 30.76%, rgba(86, 190, 216, 0) 97.76%)',

  textPrimary: colors.gray900,
  textSecondary: colors.gray400,
  textTertiary: colors.gray300,

  accentAction: colors.purpleMain,
  accentActive: colors.blue400,
  accentSuccess: colors.green300,
  accentWarning: colors.gold400,
  accentFailure: colors.red400,
  accentCritical: colors.red400,

  accentActionSoft: opacify(12, colors.purpleMain),
  accentActiveSoft: opacify(24, colors.blue400),
  accentSuccessSoft: opacify(24, colors.green300),
  accentWarningSoft: opacify(24, colors.gold400),
  accentFailureSoft: opacify(12, colors.red400),

  accentTextDarkPrimary: opacify(80, colors.gray900),
  accentTextDarkSecondary: opacify(60, colors.gray900),
  accentTextDarkTertiary: opacify(24, colors.gray900),

  accentTextLightPrimary: colors.gray50,
  accentTextLightSecondary: opacify(72, colors.gray50),
  accentTextLightTertiary: opacify(12, colors.gray50),

  deepShadow:
    '8px 12px 20px rgba(51, 53, 72, 0.04), 4px 6px 12px rgba(51, 53, 72, 0.02), 4px 4px 8px rgba(51, 53, 72, 0.04);',
  shallowShadow:
    '6px 6px 10px rgba(51, 53, 72, 0.01), 2px 2px 6px rgba(51, 53, 72, 0.02), 1px 2px 2px rgba(51, 53, 72, 0.02);',

  networkDefaultShadow: `0px 40px 120px ${opacify(12, colors.pink400)}`,

  stateOverlayHover: opacify(8, colors.gray300),
  stateOverlayPressed: opacify(24, colors.gray200),

  searchBackground: opacify(4, colors.white),
  searchOutline: opacify(1, colors.black),
}
