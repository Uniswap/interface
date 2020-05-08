import { css, FlattenSimpleInterpolation } from 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme {
    // base
    white: string
    black: string

    // text
    text1: string
    text2: string
    text3: string
    text4: string
    text5: string

    // backgrounds / greys
    bg1: string
    bg2: string
    bg3: string
    bg4: string
    bg5: string

    modalBG: string
    advancedBG: string

    //blues
    blue1: string
    blue2: string
    blue3: string
    blue4: string
    blue5: string

    buttonSecondaryText: string

    // pinks
    pink1: string
    pink2: string
    pink3: string
    pink4: string

    // other
    red1: string
    green1: string
    yellow1: string
    yellow2: string

    grids: {
      sm: number
      md: number
      lg: number
    }

    // shadows
    shadow1: string

    // media queries
    mediaWidth: { [width in keyof typeof MEDIA_WIDTHS]: typeof css }
    // css snippets
    flexColumnNoWrap: FlattenSimpleInterpolation
    flexRowNoWrap: FlattenSimpleInterpolation
  }
}
