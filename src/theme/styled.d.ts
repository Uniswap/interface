import { FlattenSimpleInterpolation, ThemedCssFunction } from 'styled-components/macro'

export type Color = string
export interface Colors {
  darkMode: boolean

  // base
  deprecated_white: Color
  deprecated_black: Color

  // text
  deprecated_text1: Color
  deprecated_text2: Color
  deprecated_text3: Color
  deprecated_text4: Color
  deprecated_text5: Color

  // backgrounds / greys
  deprecated_bg0: Color
  deprecated_bg1: Color
  deprecated_bg2: Color
  deprecated_bg3: Color
  deprecated_bg4: Color
  deprecated_bg5: Color
  deprecated_bg6: Color

  modalBG: Color
  advancedBG: Color

  //blues
  primary1: Color
  primary2: Color
  primary3: Color
  primary4: Color
  primary5: Color

  primaryText1: Color

  // pinks
  secondary1: Color
  secondary2: Color
  secondary3: Color

  // other
  red1: Color
  red2: Color
  red3: Color
  green1: Color
  yellow1: Color
  yellow2: Color
  yellow3: Color
  blue1: Color
  blue2: Color

  blue4: Color

  error: Color
  success: Color
  warning: Color
}

declare module 'styled-components/macro' {
  export interface DefaultTheme extends Colors {
    grids: Grids

    // shadows
    shadow1: string

    // media queries
    mediaWidth: {
      upToExtraSmall: ThemedCssFunction<DefaultTheme>
      upToSmall: ThemedCssFunction<DefaultTheme>
      upToMedium: ThemedCssFunction<DefaultTheme>
      upToLarge: ThemedCssFunction<DefaultTheme>
    }

    // css snippets
    flexColumnNoWrap: FlattenSimpleInterpolation
    flexRowNoWrap: FlattenSimpleInterpolation
  }
}
