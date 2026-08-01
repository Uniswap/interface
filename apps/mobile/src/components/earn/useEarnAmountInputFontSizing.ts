import { useEffect } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { fonts } from 'ui/src/theme'

export const MAX_INPUT_FONT_SIZE = fonts.heading1.fontSize
const MIN_INPUT_FONT_SIZE = 32
const MAX_CHAR_PIXEL_WIDTH = 46

export function useEarnAmountInputFontSizing({
  fiatSymbol,
  isFiatInput,
  symbol,
  value,
}: {
  fiatSymbol: string
  isFiatInput: boolean
  symbol: string
  value: string
}): { fontSize: number; onInputLayout: (event: LayoutChangeEvent) => void } {
  const {
    fontSize,
    onLayout: onInputLayout,
    onSetFontSize,
  } = useDynamicFontSizing({
    maxCharWidthAtMaxFontSize: MAX_CHAR_PIXEL_WIDTH,
    maxFontSize: MAX_INPUT_FONT_SIZE,
    minFontSize: MIN_INPUT_FONT_SIZE,
  })
  const inputDisplayValue = getEarnAmountInputSizingValue({
    fiatSymbol,
    isFiatInput,
    symbol,
    value,
  })

  useEffect(() => {
    onSetFontSize(inputDisplayValue)
  }, [inputDisplayValue, onSetFontSize])

  return { fontSize, onInputLayout }
}

export function getEarnAmountInputSizingValue({
  fiatSymbol,
  isFiatInput,
  symbol,
  value,
}: {
  fiatSymbol: string
  isFiatInput: boolean
  symbol: string
  value: string
}): string {
  const amount = value || '0'
  return isFiatInput ? `${fiatSymbol}${amount}` : `${amount} ${symbol}`
}
