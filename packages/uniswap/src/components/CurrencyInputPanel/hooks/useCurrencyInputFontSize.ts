import { useEffect } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'

const MAX_INPUT_FONT_SIZE = 36
export const MIN_INPUT_FONT_SIZE = 24

// if font changes from `fontFamily.sansSerif.regular` or `MAX_INPUT_FONT_SIZE`
// changes from 36 then width value must be adjusted
const MAX_CHAR_PIXEL_WIDTH = 23

export function useCurrencyInputFontSize(
  value: string | undefined,
  focus: boolean | undefined,
): {
  onLayout: (event: LayoutChangeEvent) => void
  fontSize: number
  lineHeight: number
} {
  const { onLayout, fontSize, onSetFontSize } = useDynamicFontSizing(
    MAX_CHAR_PIXEL_WIDTH,
    MAX_INPUT_FONT_SIZE,
    MIN_INPUT_FONT_SIZE,
  )

  const lineHeight = fontSize * 1.2

  // This is needed to ensure that the text resizes when modified from outside the component (e.g. custom numpad)
  useEffect(() => {
    if (value) {
      onSetFontSize(value)
      // Always set font size if focused to format placeholder size, we need to pass in a non-empty string to avoid formatting crash
    } else if (focus) {
      onSetFontSize('0')
    }
  }, [focus, onSetFontSize, value])

  return {
    onLayout,
    fontSize,
    lineHeight,
  }
}
