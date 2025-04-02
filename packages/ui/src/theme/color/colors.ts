import { opacifyRaw } from 'ui/src/theme/color/utils'

const accentColors = {
  pinkLight: '#FEF4FF',
  pinkPastel: '#FDAFF0',
  pinkBase: '#FC74FE',
  pinkVibrant: '#F50DB4',
  pinkDark: '#361A37',

  redLight: '#FFF2F1',
  redPastel: '#FDCFC4',
  redBase: '#FF5F52',
  redVibrant: '#FF0000',
  redDark: '#220D0C',

  orangeLight: '#FEF5EA',
  orangePastel: '#FFE8BC',
  orangeBase: '#FF8934',
  orangeVibrant: '#FF4D00',
  orangeDark: '#371B0C',

  yellowLight: '#FFFE8B',
  yellowPastel: '#FFF8B4',
  yellowBase: '#FFBF17',
  yellowVibrant: '#FFF612',
  yellowDark: '#1F1E02',

  brownLight: '#F7F6F1',
  brownPastel: '#E2E0CD',
  brownBase: '#85754A',
  brownVibrant: '#996F01',
  brownDark: '#231E0F',

  greenLight: '#EEFBF1',
  greenPastel: '#C2E7D0',
  greenBase: '#0C8911',
  greenVibrant: '#21C95E',
  greenDark: '#0F2C1A',

  limeLight: '#F7FEEB',
  limePastel: '#E4F6C4',
  limeBase: '#78E744',
  limeVibrant: '#B1F13C',
  limeDark: '#232917',

  turquoiseLight: '#F7FEEB',
  turquoisePastel: '#CAFFDF',
  turquoiseBase: '#00C3A0',
  turquoiseVibrant: '#5CFE9D',
  turquoiseDark: '#1A2A21',

  cyanLight: '#EBF8FF',
  cyanPastel: '#B9E3F8',
  cyanBase: '#23A3FF',
  cyanVibrant: '#3ADCFF',
  cyanDark: '#15242B',

  blueLight: '#EFF4FF',
  bluePastel: '#D0D9F8',
  blueBase: '#4981FF',
  blueVibrant: '#0047FF',
  blueDark: '#10143D',

  purpleLight: '#FAF5FF',
  purplePastel: '#E9D8FD',
  purpleBase: '#9E62FF',
  purpleVibrant: '#4300B0',
  purpleDark: '#1A0040',
}

export const colors = {
  white: '#FFFFFF',
  black: '#000000',
  scrim: 'rgba(0,0,0,0.60)',

  ...accentColors,

  uniswapXViolet: '#4673FA',
  uniswapXPurple: '#9646FA',

  fiatOnRampBanner: '#FB36D0',
}

export const DEP_accentColors = {
  blue200: '#ADBCFF',
  blue300: '#869EFF',
  blue400: '#4C82FB',
  gold200: '#EEB317',
  goldVibrant: '#FEB239',
  green300: '#40B66B',
  green400: '#209853',
  magenta100: '#FAD8F8',
  magenta50: '#FFF1FE',
  magentaVibrant: '#FC72FF',
  red200: '#FEA79B',
  red300: '#FD766B',
  red400: '#FA2B39',
  violet200: '#BDB8FA',
  violet400: '#7A7BEB',
  yellow100: '#F0E49A',
  yellow200: '#DBBC19',
}

export const networkColors = {
  ethereum: {
    light: '#627EEA',
    dark: '#627EEA',
  },
  optimism: {
    light: '#FF0420',
    dark: '#FF0420',
  },
  polygon: {
    light: '#8247E5',
    dark: '#8247E5',
  },
  arbitrum: {
    light: '#12AAFF',
    dark: '#12AAFF',
  },
  bnb: {
    light: '#B08603',
    dark: '#FFBF17',
  },
  base: {
    light: '#0052FF',
    dark: '#0052FF',
  },
  blast: {
    light: '#222222',
    dark: '#FCFC03',
  },
  avalanche: {
    light: '#E84142',
    dark: '#E84142',
  },
  celo: {
    light: '#222222',
    dark: '#FCFF52',
  },
  monad: {
    light: '#836EF9',
    dark: '#836EF9',
  },
  soneium: {
    light: '#000000',
    dark: '#FFFFFF',
  },
  worldchain: {
    light: '#222222',
    dark: '#FFFFFF',
  },
  unichain: {
    light: '#fc0fa4',
    dark: '#fc0fa4',
  },
  zora: {
    light: '#222222',
    dark: '#FFFFFF',
  },
  zksync: {
    light: '#3667F6',
    dark: '#3667F6',
  },
}

const sporeLight = {
  white: colors.white,
  black: colors.black,
  scrim: colors.scrim,

  neutral1: '#222222',
  neutral1Hovered: '#131313',
  neutral2: '#7D7D7D',
  neutral2Hovered: '#6B6B6B',
  neutral3: '#BFBFBF',
  neutral3Hovered: '#ADADAD',

  surface1: colors.white,
  surface1Hovered: '#F9F9F9',
  surface2: '#F9F9F9',
  surface2Hovered: '#F5F5F5',
  surface3: 'rgba(34,34,34,0.05)',
  surface3Solid: '#F2F2F2',
  surface3Hovered: 'rgba(34,34,34,0.09)',
  surface4: 'rgba(255,255,255,0.64)',
  surface5: 'rgba(0,0,0,0.04)',

  accent1: '#FC72FF',
  accent1Hovered: '#FD3CFE',
  accent2: '#FEF4FF',
  accent2Hovered: '#FEEBFC',
  accent3: '#222222',
  accent3Hovered: colors.black,

  DEP_accentSoft: '#FC72FF33', //33 = 20%
  DEP_blue400: '#4C82FB',

  statusSuccess: '#21C95E',
  statusSuccessHovered: '#15863C',
  statusSuccess2: '#EEFBF1',
  statusWarning: '#996F01',
  statusWarningHovered: '#7A5801',
  statusWarning2: '#FFFBEB',
  statusWarning2Hovered: '#FFFBD7',
  statusCritical: '#FF5F52',
  statusCriticalHovered: '#FF3931',
  statusCritical2: '#FFF2F1',
  statusCritical2Hovered: '#FFD5D4',
}

const sporeDark = {
  none: 'transparent',

  white: colors.white,
  black: colors.black,
  scrim: colors.scrim,

  neutral1: colors.white,
  neutral1Hovered: '#F9F9F9',
  neutral2: '#9B9B9B',
  neutral2Hovered: '#ADADAD',
  neutral3: '#5E5E5E',
  neutral3Hovered: '#6B6B6B',

  surface1: '#131313',
  surface1Hovered: 'rgba(24,24,24,1.00)',
  surface2: '#1B1B1B',
  surface2Hovered: 'rgba(36,36,36,1.00)',
  surface3: 'rgba(255,255,255,0.12)',
  surface3Solid: '#393939',
  surface3Hovered: 'rgba(255,255,255,0.16)',
  surface4: 'rgba(255,255,255,0.20)',
  surface5: 'rgba(0,0,0,0.04)',

  accent1: '#FC72FF',
  accent1Hovered: '#FD3CFE',
  accent2: '#361A37',
  accent2Hovered: '#510D43',
  accent3: colors.white,
  accent3Hovered: '#F5F5F5',

  DEP_accentSoft: '#FC72FF33', //33 = 20%
  DEP_blue400: '#4C82FB',

  statusSuccess: '#21C95E',
  statusSuccessHovered: '#15863C',
  statusSuccess2: '#0F2C1A',
  statusSuccess2Hovered: '#093A16',
  statusWarning: '#FFBF17',
  statusWarningHovered: '#FFDD0D',
  statusWarning2: '#1F1E02',
  statusWarning2Hovered: '#302E03',
  statusCritical: '#FF5F52',
  statusCriticalHovered: '#FF3931',
  statusCritical2: '#220D0C',
  statusCritical2Hovered: '#470402',
}

export const colorsLight = {
  none: 'transparent',

  white: sporeLight.white,
  black: sporeLight.black,
  scrim: sporeLight.scrim,

  neutral1: sporeLight.neutral1,
  neutral1Hovered: sporeLight.neutral1Hovered,
  neutral2: sporeLight.neutral2,
  neutral2Hovered: sporeLight.neutral2Hovered,
  neutral3: sporeLight.neutral3,
  neutral3Hovered: sporeLight.neutral3Hovered,

  surface1: sporeLight.surface1,
  surface1Hovered: sporeLight.surface1Hovered,
  surface2: sporeLight.surface2,
  surface2Hovered: sporeLight.surface2Hovered,
  surface3: sporeLight.surface3,
  surface3Solid: sporeLight.surface3Solid,
  surface3Hovered: sporeLight.surface3Hovered,
  surface4: sporeLight.surface4,
  surface5: sporeLight.surface5,

  accent1: sporeLight.accent1,
  accent1Hovered: sporeLight.accent1Hovered,
  accent2: sporeLight.accent2,
  accent2Hovered: sporeLight.accent2Hovered,
  accent3: sporeLight.accent3,
  accent3Hovered: sporeLight.accent3Hovered,

  DEP_accentSoft: sporeLight.DEP_accentSoft,
  DEP_blue400: sporeLight.DEP_blue400,

  statusSuccess: sporeLight.statusSuccess,
  statusSuccess2: sporeLight.statusSuccess2,
  statusCritical: sporeLight.statusCritical,
  statusCriticalHovered: sporeLight.statusCriticalHovered,
  statusCritical2: sporeLight.statusCritical2,
  statusCritical2Hovered: sporeLight.statusCritical2Hovered,
  statusWarning: sporeLight.statusWarning,
  statusWarningHovered: sporeLight.statusWarningHovered,
  statusWarning2: sporeLight.statusWarning2,
  statusWarning2Hovered: sporeLight.statusWarning2Hovered,

  DEP_backgroundBranded: '#FCF7FF',
  DEP_backgroundOverlay: opacifyRaw(60, colors.white),

  DEP_accentWarning: DEP_accentColors.goldVibrant,

  DEP_accentBranded: DEP_accentColors.magentaVibrant,
  DEP_shadowBranded: DEP_accentColors.magentaVibrant,

  DEP_accentSuccessSoft: opacifyRaw(24, DEP_accentColors.green400),
  DEP_accentWarningSoft: opacifyRaw(24, DEP_accentColors.goldVibrant),
  DEP_accentCriticalSoft: opacifyRaw(12, DEP_accentColors.red400),

  DEP_brandedAccentSoft: DEP_accentColors.magenta100,
  DEP_magentaDark: opacifyRaw(12, DEP_accentColors.magentaVibrant),

  DEP_fiatBanner: colors.fiatOnRampBanner,

  chain_1: sporeLight.neutral1,
  chain_130: networkColors.unichain.light,
  chain_10: networkColors.optimism.light,
  chain_137: networkColors.polygon.light,
  chain_42161: networkColors.arbitrum.light,
  chain_80001: networkColors.polygon.light,
  chain_8453: networkColors.base.light,
  chain_7777777: networkColors.zora.light,
  chain_81457: networkColors.blast.light,
  chain_56: networkColors.bnb.light,
  chain_42220: networkColors.celo.light,
  chain_43114: networkColors.avalanche.light,
  chain_324: networkColors.zksync.light,
  chain_480: networkColors.worldchain.light,
  chain_1868: networkColors.soneium.light,

  // Testnets
  chain_11155111: networkColors.ethereum.light,
  chain_1301: networkColors.unichain.light,
  chain_10143: networkColors.monad.light,

  pinkThemed: colors.pinkLight,
}

export type ColorKeys = keyof typeof colorsLight

export const colorsDark = {
  none: 'transparent',

  white: sporeDark.white,
  black: sporeDark.black,

  surface1: sporeDark.surface1,
  surface1Hovered: sporeDark.surface1Hovered,
  surface2: sporeDark.surface2,
  surface2Hovered: sporeDark.surface2Hovered,
  surface3: sporeDark.surface3,
  surface3Solid: sporeDark.surface3Solid,
  surface3Hovered: sporeDark.surface3Hovered,
  surface4: sporeDark.surface4,
  surface5: sporeDark.surface5,

  scrim: sporeDark.scrim,

  neutral1: sporeDark.neutral1,
  neutral1Hovered: sporeDark.neutral1Hovered,
  neutral2: sporeDark.neutral2,
  neutral2Hovered: sporeDark.neutral2Hovered,
  neutral3: sporeDark.neutral3,
  neutral3Hovered: sporeDark.neutral3Hovered,

  accent1: sporeDark.accent1,
  accent1Hovered: sporeDark.accent1Hovered,
  accent2: sporeDark.accent2,
  accent2Hovered: sporeDark.accent2Hovered,
  accent3: sporeDark.accent3,
  accent3Hovered: sporeDark.accent3Hovered,

  DEP_accentSoft: sporeDark.DEP_accentSoft,
  DEP_blue400: sporeDark.DEP_blue400,

  statusSuccess: sporeDark.statusSuccess,
  statusSuccess2: sporeDark.statusSuccess2,
  statusCritical: sporeDark.statusCritical,
  statusCriticalHovered: sporeDark.statusCriticalHovered,
  statusCritical2: sporeDark.statusCritical2,
  statusCritical2Hovered: sporeDark.statusCritical2Hovered,
  statusWarning: sporeDark.statusWarning,
  statusWarningHovered: sporeDark.statusWarningHovered,
  statusWarning2: sporeDark.statusWarning2,
  statusWarning2Hovered: sporeDark.statusWarning2Hovered,

  DEP_backgroundBranded: '#100D1C',
  DEP_backgroundOverlay: opacifyRaw(10, colors.white),

  DEP_accentWarning: colors.yellowVibrant,

  DEP_accentBranded: DEP_accentColors.magentaVibrant,
  // TODO(MOB-160): accommodate one-off color in cleaner way
  DEP_shadowBranded: '#B60ACF',

  DEP_accentSuccessSoft: opacifyRaw(24, colors.greenVibrant),
  DEP_accentWarningSoft: opacifyRaw(24, colors.yellowBase),
  DEP_accentCriticalSoft: opacifyRaw(12, colors.redVibrant),

  DEP_brandedAccentSoft: '#46244F', // git blame Chelsy
  DEP_magentaDark: opacifyRaw(12, DEP_accentColors.magentaVibrant),

  DEP_fiatBanner: colors.fiatOnRampBanner,

  chain_1: sporeDark.neutral1,
  chain_130: networkColors.unichain.dark,
  chain_10: networkColors.optimism.dark,
  chain_137: networkColors.polygon.dark,
  chain_42161: networkColors.arbitrum.dark,
  chain_80001: networkColors.polygon.dark,
  chain_8453: networkColors.base.dark,
  chain_7777777: networkColors.zora.dark,
  chain_81457: networkColors.blast.dark,
  chain_56: networkColors.bnb.dark,
  chain_42220: networkColors.celo.dark,
  chain_43114: networkColors.avalanche.dark,
  chain_324: networkColors.zksync.dark,
  chain_480: networkColors.worldchain.dark,
  chain_1868: networkColors.soneium.dark,

  // Testnets
  chain_11155111: networkColors.ethereum.dark,
  chain_1301: networkColors.unichain.dark,
  chain_10143: networkColors.monad.dark,

  pinkThemed: colors.pinkDark,
}
