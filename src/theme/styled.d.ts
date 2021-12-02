import { FlattenSimpleInterpolation, ThemedCssFunction } from 'styled-components'

export type Color = string
export interface Colors {
  // base
  white: Color
  black: Color

  // text
  text: Color
  textReverse: Color
  subText: Color
  text2: Color
  text3: Color
  text4: Color
  text6: Color
  text7: Color
  text8: Color
  text9: Color
  text10: Color
  text11: Color
  text12: Color
  text13: Color
  disableText: Color

  // backgrounds / greys
  tableHeader: Color
  background: Color
  bg1: Color
  bg2: Color
  bg3: Color
  bg4: Color
  bg5: Color
  bg6: Color
  bg7: Color
  bg8: Color
  bg9: Color
  bg10: Color
  bg11: Color
  bg12: Color
  bg13: Color
  bg14: Color
  bg15: Color
  bg16: Color
  bg17: Color
  bg18: Color
  bg19: Color
  bg20: Color
  buttonBlack: Color
  buttonGray: Color
  poweredByText: Color

  modalBG: Color
  advancedBG: Color
  advancedBorder: Color

  //blues
  primary: Color
  primary2: Color
  primary3: Color
  primary4: Color
  primary5: Color

  primaryText2: Color

  // pinks
  secondary1: Color
  secondary2: Color
  secondary3: Color
  secondary4: Color

  // border colors
  border: Color
  btnOutline: Color

  // table colors
  oddRow: Color
  evenRow: Color

  // other
  red: Color
  red1: Color
  red2: Color
  red3: Color
  green: Color
  green1: Color
  yellow1: Color
  yellow2: Color
  blue1: Color
  warning: Color
  lightBlue: Color
  darkBlue: Color
  blue: Color
  lightGreen: Color
  apr: Color
}

export interface Grids {
  sm: number
  md: number
  lg: number
}

declare module 'styled-components' {
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
      upToXL: ThemedCssFunction<DefaultTheme>
      upToXXL: ThemedCssFunction<DefaultTheme>
    }

    // css snippets
    flexColumnNoWrap: FlattenSimpleInterpolation
    flexRowNoWrap: FlattenSimpleInterpolation
  }
}
