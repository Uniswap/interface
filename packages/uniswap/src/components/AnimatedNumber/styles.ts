import type { TextStyle, ViewStyle } from 'react-native'

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
