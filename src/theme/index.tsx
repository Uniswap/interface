import { Phase0Variant, usePhase0Flag } from 'featureFlags/flags/phase0'
import React, { useMemo } from 'react'
import { Text, TextProps as TextPropsOriginal } from 'rebass'
import styled, {
  createGlobalStyle,
  css,
  DefaultTheme,
  ThemeProvider as StyledComponentsThemeProvider,
} from 'styled-components/macro'

import { useIsDarkMode } from '../state/user/hooks'
import { colors as ColorsPalette, colorsDark, colorsLight } from './colors'
import { Colors, ThemeColors } from './styled'
import { opacify } from './utils'

export * from './components'

type TextProps = Omit<TextPropsOriginal, 'css'>

export const MEDIA_WIDTHS = {
  upToExtraSmall: 500,
  upToSmall: 720,
  upToMedium: 960,
  upToLarge: 1280,
}

// Migrating to a standard z-index system https://getbootstrap.com/docs/5.0/layout/z-index/
// Please avoid using deprecated numbers
export enum Z_INDEX {
  deprecated_zero = 0,
  deprecated_content = 1,
  dropdown = 1000,
  sticky = 1020,
  fixed = 1030,
  modalBackdrop = 1040,
  offcanvas = 1050,
  modal = 1060,
  popover = 1070,
  tooltip = 1080,
}

const mediaWidthTemplates: { [width in keyof typeof MEDIA_WIDTHS]: typeof css } = Object.keys(MEDIA_WIDTHS).reduce(
  (accumulator, size) => {
    ;(accumulator as any)[size] = (a: any, b: any, c: any) => css`
      @media (max-width: ${(MEDIA_WIDTHS as any)[size]}px) {
        ${css(a, b, c)}
      }
    `
    return accumulator
  },
  {}
) as any

const deprecated_white = ColorsPalette.white
const deprecated_black = ColorsPalette.black

function uniswapThemeColors(darkMode: boolean): ThemeColors {
  return {
    userThemeColor: darkMode ? colorsDark.userThemeColor : colorsLight.userThemeColor,

    backgroundBackdrop: darkMode ? colorsDark.backgroundBackdrop : colorsLight.backgroundBackdrop,
    backgroundSurface: darkMode ? colorsDark.backgroundSurface : colorsLight.backgroundSurface,
    backgroundContainer: darkMode ? colorsDark.backgroundContainer : colorsLight.backgroundContainer,
    backgroundAction: darkMode ? colorsDark.backgroundAction : colorsLight.backgroundAction,
    backgroundOutline: darkMode ? colorsDark.backgroundOutline : colorsLight.backgroundOutline,
    backgroundScrim: darkMode ? colorsDark.backgroundScrim : colorsLight.backgroundScrim,

    textPrimary: darkMode ? colorsDark.textPrimary : colorsLight.textPrimary,
    textSecondary: darkMode ? colorsDark.textSecondary : colorsLight.textSecondary,
    textTertiary: darkMode ? colorsDark.textTertiary : colorsLight.textTertiary,

    accentAction: darkMode ? colorsDark.accentAction : colorsLight.accentAction,
    accentActive: darkMode ? colorsDark.accentActive : colorsLight.accentActive,
    accentSuccess: darkMode ? colorsDark.accentSuccess : colorsLight.accentSuccess,
    accentWarning: darkMode ? colorsDark.accentWarning : colorsLight.accentWarning,
    accentFailure: darkMode ? colorsDark.accentFailure : colorsLight.accentFailure,

    accentActionSoft: darkMode ? colorsDark.accentActionSoft : colorsLight.accentActionSoft,
    accentActiveSoft: darkMode ? colorsDark.accentActiveSoft : colorsLight.accentActiveSoft,
    accentSuccessSoft: darkMode ? colorsDark.accentSuccessSoft : colorsLight.accentSuccessSoft,
    accentWarningSoft: darkMode ? colorsDark.accentWarningSoft : colorsLight.accentWarningSoft,
    accentFailureSoft: darkMode ? colorsDark.accentFailureSoft : colorsLight.accentFailureSoft,

    accentTextDarkPrimary: darkMode ? colorsDark.accentTextDarkPrimary : colorsLight.accentTextDarkPrimary,
    accentTextDarkSecondary: darkMode ? colorsDark.accentTextDarkSecondary : colorsLight.accentTextDarkSecondary,
    accentTextDarkTertiary: darkMode ? colorsDark.accentTextDarkTertiary : colorsLight.accentTextDarkTertiary,

    accentTextLightPrimary: darkMode ? colorsDark.accentTextLightPrimary : colorsLight.accentTextLightPrimary,
    accentTextLightSecondary: darkMode ? colorsDark.accentTextLightSecondary : colorsLight.accentTextLightSecondary,
    accentTextLightTertiary: darkMode ? colorsDark.accentTextLightTertiary : colorsLight.accentTextLightTertiary,

    none: colorsDark.none,
    white: ColorsPalette.white,
    black: ColorsPalette.black,

    // chain colors are same for light/dark mode
    chain_1: colorsDark.chain_1,
    chain_3: colorsDark.chain_3,
    chain_4: colorsDark.chain_4,
    chain_5: colorsDark.chain_5,
    chain_10: colorsDark.chain_10,
    chain_137: colorsDark.chain_137,
    chain_42: colorsDark.chain_42,
    chain_69: colorsDark.chain_69,
    chain_42161: colorsDark.chain_42161,
    chain_421611: colorsDark.chain_421611,
    chain_80001: colorsDark.chain_80001,

    blue200: ColorsPalette.blue200,
  }
}

function oldColors(darkMode: boolean): Colors {
  return {
    darkMode,
    // base
    deprecated_white,
    deprecated_black,

    // text
    deprecated_text1: darkMode ? '#FFFFFF' : '#000000',
    deprecated_text2: darkMode ? '#C3C5CB' : '#565A69',
    deprecated_text3: darkMode ? '#8F96AC' : '#6E727D',
    deprecated_text4: darkMode ? '#B2B9D2' : '#C3C5CB',
    deprecated_text5: darkMode ? '#2C2F36' : '#EDEEF2',

    // backgrounds / greys
    deprecated_bg0: darkMode ? '#191B1F' : '#FFF',
    deprecated_bg1: darkMode ? '#212429' : '#F7F8FA',
    deprecated_bg2: darkMode ? '#2C2F36' : '#EDEEF2',
    deprecated_bg3: darkMode ? '#40444F' : '#CED0D9',
    deprecated_bg4: darkMode ? '#565A69' : '#888D9B',
    deprecated_bg5: darkMode ? '#6C7284' : '#888D9B',
    deprecated_bg6: darkMode ? '#1A2028' : '#6C7284',

    //specialty colors
    deprecated_modalBG: darkMode ? 'rgba(0,0,0,.425)' : 'rgba(0,0,0,0.3)',
    deprecated_advancedBG: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.6)',

    //primary colors
    deprecated_primary1: darkMode ? '#2172E5' : '#E8006F',
    deprecated_primary2: darkMode ? '#3680E7' : '#FF8CC3',
    deprecated_primary3: darkMode ? '#4D8FEA' : '#FF99C9',
    deprecated_primary4: darkMode ? '#376bad70' : '#F6DDE8',
    deprecated_primary5: darkMode ? '#153d6f70' : '#FDEAF1',

    // color text
    deprecated_primaryText1: darkMode ? '#5090ea' : '#D50066',

    // secondary colors
    deprecated_secondary1: darkMode ? '#2172E5' : '#E8006F',
    deprecated_secondary2: darkMode ? '#17000b26' : '#F6DDE8',
    deprecated_secondary3: darkMode ? '#17000b26' : '#FDEAF1',

    // other
    deprecated_red1: darkMode ? '#FF4343' : '#DA2D2B',
    deprecated_red2: darkMode ? '#F82D3A' : '#DF1F38',
    deprecated_red3: '#D60000',
    deprecated_green1: darkMode ? '#27AE60' : '#007D35',
    deprecated_yellow1: '#E3A507',
    deprecated_yellow2: '#FF8F00',
    deprecated_yellow3: '#F3B71E',
    deprecated_blue1: darkMode ? '#2172E5' : '#0068FC',
    deprecated_blue2: darkMode ? '#5199FF' : '#0068FC',
    deprecated_error: darkMode ? '#FD4040' : '#DF1F38',
    deprecated_success: darkMode ? '#27AE60' : '#007D35',
    deprecated_warning: '#FF8F00',

    // dont wanna forget these blue yet
    deprecated_blue4: darkMode ? '#153d6f70' : '#C4D9F8',
  }
}

function oldColorsUpdated(darkMode: boolean): Colors {
  return {
    darkMode,
    // base
    deprecated_white,
    deprecated_black,

    // text
    deprecated_text1: darkMode ? colorsDark.textPrimary : colorsLight.textPrimary,
    deprecated_text2: darkMode ? colorsDark.textSecondary : colorsLight.textSecondary,
    deprecated_text3: darkMode ? colorsDark.textTertiary : colorsLight.textTertiary,
    deprecated_text4: darkMode ? ColorsPalette.gray200 : ColorsPalette.gray300,
    deprecated_text5: darkMode ? ColorsPalette.gray500 : ColorsPalette.gray50,

    // backgrounds / greys
    deprecated_bg0: darkMode ? ColorsPalette.gray900 : ColorsPalette.white,
    deprecated_bg1: darkMode ? ColorsPalette.gray800 : ColorsPalette.gray50,
    deprecated_bg2: darkMode ? ColorsPalette.gray700 : ColorsPalette.gray100,
    deprecated_bg3: darkMode ? ColorsPalette.gray600 : ColorsPalette.gray200,
    deprecated_bg4: darkMode ? ColorsPalette.gray500 : ColorsPalette.gray300,
    deprecated_bg5: darkMode ? ColorsPalette.gray400 : ColorsPalette.gray400,
    deprecated_bg6: darkMode ? ColorsPalette.gray300 : ColorsPalette.gray500,

    //specialty colors
    deprecated_modalBG: darkMode ? opacify(40, ColorsPalette.black) : opacify(30, ColorsPalette.black),
    deprecated_advancedBG: darkMode ? opacify(10, ColorsPalette.black) : opacify(60, ColorsPalette.white),

    //primary colors
    deprecated_primary1: darkMode ? colorsDark.accentAction : colorsLight.accentAction,
    deprecated_primary2: darkMode ? ColorsPalette.blue400 : ColorsPalette.pink300,
    deprecated_primary3: darkMode ? ColorsPalette.blue300 : ColorsPalette.pink200,
    deprecated_primary4: darkMode ? '#376bad70' : '#F6DDE8',
    deprecated_primary5: darkMode ? '#153d6f70' : '#FDEAF1',

    // color text
    deprecated_primaryText1: darkMode ? colorsDark.accentAction : colorsLight.accentAction,

    // secondary colors
    deprecated_secondary1: darkMode ? colorsDark.accentAction : colorsLight.accentAction,
    deprecated_secondary2: darkMode ? opacify(25, ColorsPalette.gray900) : '#F6DDE8',
    deprecated_secondary3: darkMode ? opacify(25, ColorsPalette.gray900) : '#FDEAF1',

    // other
    deprecated_red1: darkMode ? colorsDark.accentFailure : colorsLight.accentFailure,
    deprecated_red2: darkMode ? colorsDark.accentFailure : colorsLight.accentFailure,
    deprecated_red3: darkMode ? colorsDark.accentFailure : colorsLight.accentFailure,
    deprecated_green1: darkMode ? colorsDark.accentSuccess : colorsLight.accentSuccess,
    deprecated_yellow1: ColorsPalette.yellow400,
    deprecated_yellow2: ColorsPalette.yellow500,
    deprecated_yellow3: ColorsPalette.yellow600,
    deprecated_blue1: darkMode ? colorsDark.accentAction : colorsLight.accentAction,
    deprecated_blue2: darkMode ? colorsDark.accentAction : colorsLight.accentAction,
    deprecated_error: darkMode ? colorsDark.accentFailure : colorsLight.accentFailure,
    deprecated_success: darkMode ? colorsDark.accentSuccess : colorsLight.accentSuccess,
    deprecated_warning: darkMode ? colorsDark.accentWarning : colorsLight.accentWarning,

    // dont wanna forget these blue yet
    deprecated_blue4: darkMode ? '#153d6f70' : '#C4D9F8',
    // blue5: darkMode ? '#153d6f70' : '#EBF4FF',
    // deprecated_blue5: '#869EFF',
  }
}

function getTheme(darkMode: boolean, isNewColorsEnabled: boolean): DefaultTheme {
  const useColors = isNewColorsEnabled ? oldColorsUpdated(darkMode) : oldColors(darkMode)
  return {
    ...uniswapThemeColors(darkMode),
    ...useColors,

    grids: {
      sm: 8,
      md: 12,
      lg: 24,
    },

    //shadows
    shadow1: darkMode ? '#000' : '#2F80ED',

    // media queries
    mediaWidth: mediaWidthTemplates,

    // css snippets
    flexColumnNoWrap: css`
      display: flex;
      flex-flow: column nowrap;
    `,
    flexRowNoWrap: css`
      display: flex;
      flex-flow: row nowrap;
    `,
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const phase0Flag = usePhase0Flag()
  const darkMode = useIsDarkMode()
  const themeObject = useMemo(() => getTheme(darkMode, phase0Flag === Phase0Variant.Enabled), [darkMode, phase0Flag])
  return <StyledComponentsThemeProvider theme={themeObject}>{children}</StyledComponentsThemeProvider>
}

const TextWrapper = styled(Text)<{ color: keyof Colors }>`
  color: ${({ color, theme }) => (theme as any)[color]};
`

/**
 * Preset styles of the Rebass Text component
 */
export const ThemedText = {
  DeprecatedMain(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'deprecated_text2'} {...props} />
  },
  DeprecatedLink(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'deprecated_primary1'} {...props} />
  },
  DeprecatedLabel(props: TextProps) {
    return <TextWrapper fontWeight={600} color={'deprecated_text1'} {...props} />
  },
  DeprecatedBlack(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'deprecated_text1'} {...props} />
  },
  DeprecatedWhite(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'deprecated_white'} {...props} />
  },
  DeprecatedBody(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={16} color={'deprecated_text1'} {...props} />
  },
  DeprecatedLargeHeader(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={24} {...props} />
  },
  DeprecatedMediumHeader(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={20} {...props} />
  },
  DeprecatedSubHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={14} {...props} />
  },
  DeprecatedSmall(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={11} {...props} />
  },
  DeprecatedBlue(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'deprecated_blue1'} {...props} />
  },
  DeprecatedYellow(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'deprecated_yellow3'} {...props} />
  },
  DeprecatedDarkGray(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'deprecated_text3'} {...props} />
  },
  DeprecatedGray(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'deprecated_bg3'} {...props} />
  },
  DeprecatedItalic(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={12} fontStyle={'italic'} color={'deprecated_text2'} {...props} />
  },
  DeprecatedError({ error, ...props }: { error: boolean } & TextProps) {
    return <TextWrapper fontWeight={500} color={error ? 'deprecated_red1' : 'deprecated_text2'} {...props} />
  },
}

export const ThemedGlobalStyle = createGlobalStyle`
html {
  color: ${({ theme }) => theme.deprecated_text1};
  background-color: ${({ theme }) => theme.deprecated_bg1} !important;
}

a {
 color: ${({ theme }) => theme.deprecated_blue1}; 
}
`
