import type { TextStyle, ViewStyle } from 'react-native'

export const BALANCE_CHANGE_INDICATION_DURATION = 500
export const NUMBER_ARRAY = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
export const NUMBER_WIDTH_ARRAY = [29, 20, 29, 29, 29, 29, 29, 29, 29, 29]
export const DIGIT_HEIGHT = 40
export const DIGIT_MAX_WIDTH = 29
export const ADDITIONAL_WIDTH_FOR_ANIMATIONS = 8

export type AnimatedNumberProps = {
  loadingPlaceholderText: string
  loading: boolean | 'no-shimmer'
  value?: string
  balance?: number
  colorIndicationDuration: number
  shouldFadeDecimals: boolean
  warmLoading: boolean
  disableAnimations?: boolean
  isRightToLeft: boolean
  EndElement?: JSX.Element
}

export interface AnimatedCharStylesType {
  wrapperStyle: ViewStyle
}

export interface AnimatedFontStylesType {
  fontStyle: TextStyle
  invisible: TextStyle
}

export const AnimatedCharStyles: AnimatedCharStylesType = {
  wrapperStyle: {
    overflow: 'hidden',
  },
}

export const AnimatedFontStyles: AnimatedFontStylesType = {
  fontStyle: {
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 40,
    top: 1,
  },
  invisible: {
    opacity: 0,
    position: 'absolute',
  },
}

export default function AnimatedNumber(_props: AnimatedNumberProps): JSX.Element {
  throw new Error('AnimatedNumber: Implemented in .native.tsx and .web.tsx')
}
