import { InterpolationWithTheme } from '@emotion/core'
import {
  BoxProps as BoxP,
  ButtonProps as ButtonP,
  FlexProps as FlexP,
  LinkProps as LinkP,
  TextProps as TextP,
} from 'rebass'

declare module 'rebass' {
  interface BoxProps extends BoxP {
    css?: InterpolationWithTheme<any>
  }
  interface ButtonProps extends ButtonP {
    css?: InterpolationWithTheme<any>
  }
  interface FlexProps extends FlexP {
    css?: InterpolationWithTheme<any>
  }
  interface LinkProps extends LinkP {
    css?: InterpolationWithTheme<any>
  }
  interface TextProps extends TextP {
    css?: InterpolationWithTheme<any>
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      css?: InterpolationWithTheme<any>
    }
  }
}
