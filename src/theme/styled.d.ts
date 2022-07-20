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

  deprecated_modalBG: Color
  deprecated_advancedBG: Color

  //blues
  deprecated_primary1: Color
  deprecated_primary2: Color
  deprecated_primary3: Color
  deprecated_primary4: Color
  deprecated_primary5: Color

  deprecated_primaryText1: Color

  // pinks
  deprecated_secondary1: Color
  deprecated_secondary2: Color
  deprecated_secondary3: Color

  // other
  deprecated_red1: Color
  deprecated_red2: Color
  deprecated_red3: Color
  deprecated_green1: Color
  deprecated_yellow1: Color
  deprecated_yellow2: Color
  deprecated_yellow3: Color
  deprecated_blue1: Color
  deprecated_blue2: Color

  deprecated_blue4: Color

  deprecated_error: Color
  deprecated_success: Color
  deprecated_warning: Color
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
