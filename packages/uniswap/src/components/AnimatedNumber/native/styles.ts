import { Platform } from 'react-native'
import type { TextStyle } from 'react-native'
import { fonts } from 'ui/src/theme'

export const AnimatedFontStyles = {
  fontStyle: {
    fontSize: fonts.heading2.fontSize,
    // special case for the home screen balance, instead of using the heading2 font weight
    fontWeight: '500',
    lineHeight: fonts.heading2.lineHeight,
    top: 1,
  } satisfies TextStyle,
  invisible: {
    opacity: 0,
    position: 'absolute',
  } satisfies TextStyle,
}

export const NativeNumberTextStyles = {
  fontStyle: {
    // Use the button font family for number rendering because android's "Book" variant
    // looks noticeably thinner than the balance text shown elsewhere in this component.
    fontFamily: fonts.buttonLabel1.family,
  } satisfies TextStyle,
}

export const StaticNumberStyles = {
  fontStyle: {
    ...NativeNumberTextStyles.fontStyle,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  } satisfies TextStyle,
}
