/**
 * The legacy Spore JS palette (`colors`, `colorsLight`/`colorsDark`, `themes`), formerly
 * defined in `ui/src/theme`. Semantic values come from `@universe/tailwind` via
 * `semantic-colors.generated.ts`; only colours tailwind has no source for (the accent
 * scale, deprecated `DEP_*` entries, per-network colours) are declared here.
 *
 * Platform-neutral and dependency-free so build scripts can import it directly.
 */
import { BASE_COLORS, SEMANTIC_COLORS_DARK, SEMANTIC_COLORS_LIGHT } from './semantic-colors.generated'

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
  ...BASE_COLORS,

  ...accentColors,

  uniswapXViolet: '#4673FA',
  uniswapXPurple: '#7D55FB',

  fiatOnRampBanner: '#FB36D0',
}

export type GlobalPalette = typeof colors
export type GlobalColorNames = keyof GlobalPalette

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
  ethereum: { light: '#627EEA', dark: '#627EEA' },
  optimism: { light: '#FF0420', dark: '#FF0420' },
  polygon: { light: '#8247E5', dark: '#8247E5' },
  arbitrum: { light: '#12AAFF', dark: '#12AAFF' },
  bnb: { light: '#B08603', dark: '#FFBF17' },
  base: { light: '#0052FF', dark: '#0052FF' },
  avalanche: { light: '#E84142', dark: '#E84142' },
  celo: { light: '#222222', dark: '#FCFF52' },
  monad: { light: '#735BF8', dark: '#836EF9' },
  solana: { light: '#9945FF', dark: '#9945FF' },
  linea: { light: '#121212', dark: '#61DFFF' },
  arc: { light: '#2B5CE6', dark: '#6E8FF7' },
  megaeth: { light: '#19191A', dark: '#FFFFFF' },
  robinhood: { light: '#00C805', dark: '#00C805' },
  ink: { light: '#7757E2', dark: '#7757E2' },
  soneium: { light: '#000000', dark: '#FFFFFF' },
  tempo: { light: '#1A1A2E', dark: '#E8E8F0' },
  xlayer: { light: '#383838', dark: '#A7A7A7' },
  worldchain: { light: '#222222', dark: '#FFFFFF' },
  unichain: { light: '#fc0fa4', dark: '#fc0fa4' },
  zora: { light: '#222222', dark: '#FFFFFF' },
  zksync: { light: '#3667F6', dark: '#3667F6' },
}

const sporeLight = {
  ...BASE_COLORS,
  ...SEMANTIC_COLORS_LIGHT,
  DEP_accentSoft: '#FC72FF33', //33 = 20%
  DEP_blue400: '#4C82FB',
}

const sporeDark = {
  ...BASE_COLORS,
  ...SEMANTIC_COLORS_DARK,
  DEP_accentSoft: '#FC72FF33', //33 = 20%
  DEP_blue400: '#4C82FB',
}

/** `chain_<id>` theme tokens → the network whose colour they take (`chain_1` uses neutral1). */
const CHAIN_NETWORKS = {
  chain_130: 'unichain',
  chain_10: 'optimism',
  chain_137: 'polygon',
  chain_42161: 'arbitrum',
  chain_80001: 'polygon',
  chain_8453: 'base',
  chain_7777777: 'zora',
  chain_56: 'bnb',
  chain_42220: 'celo',
  chain_43114: 'avalanche',
  chain_324: 'zksync',
  chain_480: 'worldchain',
  chain_1868: 'soneium',
  chain_4217: 'tempo',
  chain_196: 'xlayer',
  chain_59144: 'linea',
  chain_4326: 'megaeth',
  chain_4663: 'robinhood',
  chain_5042: 'arc',
  chain_57073: 'ink',
  chain_501000101: 'solana',
  chain_143: 'monad',
  // Testnets
  chain_11155111: 'ethereum',
  chain_1301: 'unichain',
  chain_10143: 'monad',
} as const satisfies Record<string, keyof typeof networkColors>

type ChainColors = { chain_1: string } & { -readonly [K in keyof typeof CHAIN_NETWORKS]: string }

export const colorsLight = {
  none: 'transparent',

  ...sporeLight,

  // Contrast tokens: the opposite theme's base values, for content that must
  // render inverted against the active theme (e.g. Coachmark, whose portalled
  // popup escapes any ancestor theme scope). Minimal set — add more only when
  // a consumer needs them.
  neutral1Contrast: sporeDark.neutral1,
  surface1Contrast: sporeDark.surface1,
  surface3Contrast: sporeDark.surface3,

  DEP_backgroundBranded: '#FCF7FF',
  DEP_backgroundOverlay: '#FFFFFF99', // white at 60%
  DEP_accentBranded: DEP_accentColors.magentaVibrant,
  DEP_shadowBranded: DEP_accentColors.magentaVibrant,
  DEP_brandedAccentSoft: DEP_accentColors.magenta100,
  DEP_magentaDark: '#FC72FF1f', // magentaVibrant at 12%
  DEP_fiatBanner: colors.fiatOnRampBanner,

  ...chainColors('light', sporeLight.neutral1),

  pinkThemed: colors.pinkLight,
}

export type ColorKeys = keyof typeof colorsLight

export const colorsDark: typeof colorsLight = {
  none: 'transparent',

  ...sporeDark,

  // Contrast tokens — see colorsLight.
  neutral1Contrast: sporeLight.neutral1,
  surface1Contrast: sporeLight.surface1,
  surface3Contrast: sporeLight.surface3,

  DEP_backgroundBranded: '#100D1C',
  DEP_backgroundOverlay: '#FFFFFF1a', // white at 10%
  DEP_accentBranded: DEP_accentColors.magentaVibrant,
  // TODO(MOB-160): accommodate one-off color in cleaner way
  DEP_shadowBranded: '#B60ACF',
  DEP_brandedAccentSoft: '#46244F',
  DEP_magentaDark: '#FC72FF1f', // magentaVibrant at 12%
  DEP_fiatBanner: colors.fiatOnRampBanner,

  ...chainColors('dark', sporeDark.neutral1),

  pinkThemed: colors.pinkDark,
}

// `none` is dropped from the themes: it would make `$none` space tokens resolve to transparent.
const { none: _lightNone, ...themeColorsLight } = colorsLight
const { none: _darkNone, ...themeColorsDark } = colorsDark

const light = {
  ...themeColorsLight,
  transparent: 'transparent',

  // Aliases legacy Tamagui components expected on every theme.
  background: colorsLight.surface1,
  backgroundHover: colorsLight.surface2,
  backgroundPress: colorsLight.surface2,
  backgroundFocus: colorsLight.surface2,
  borderColor: 'transparent',
  borderColorHover: 'transparent',
  borderColorFocus: 'transparent',
  outlineColor: 'transparent',
  color: colorsLight.neutral1,
  colorHover: colorsLight.accent1,
  colorPress: colorsLight.accent1,
  colorFocus: colorsLight.accent1,
  shadowColor: 'rgba(0,0,0,0.15)',
  shadowColorHover: 'rgba(0,0,0,0.2)',
}

type BaseTheme = typeof light

const dark: BaseTheme = {
  ...themeColorsDark,
  transparent: 'transparent',
  background: colorsDark.surface1,
  backgroundHover: colorsDark.surface2,
  backgroundPress: colorsDark.surface2,
  backgroundFocus: colorsDark.surface2,
  borderColor: 'transparent',
  borderColorHover: 'transparent',
  borderColorFocus: 'transparent',
  outlineColor: 'transparent',
  color: colorsDark.neutral1,
  colorHover: colorsDark.accent1,
  colorPress: colorsDark.accent1,
  colorFocus: colorsDark.accent1,
  shadowColor: 'rgba(0,0,0,0.4)',
  shadowColorHover: 'rgba(0,0,0,0.5)',
}

export const themes: Record<'dark' | 'light', BaseTheme> = { dark, light }

function chainColors(theme: 'light' | 'dark', neutral1: string): ChainColors {
  const out = { chain_1: neutral1 } as ChainColors
  for (const [token, network] of Object.entries(CHAIN_NETWORKS)) {
    out[token as keyof typeof CHAIN_NETWORKS] = networkColors[network][theme]
  }
  return out
}
