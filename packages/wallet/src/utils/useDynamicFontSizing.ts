import { useCallback, useRef, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'

export function useDynamicFontSizing(
  maxCharWidthAtMaxFontSize: number,
  maxFontSize: number,
  minFontSize: number
): {
  onLayout: (event: LayoutChangeEvent) => void
  fontSize: number
  onSetFontSize: (amount: string) => void
} {
  const [fontSize, setFontSize] = useState(maxFontSize)
  const textInputElementWidthRef = useRef(0)

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    if (textInputElementWidthRef.current) {
      return
    }

    const width = event.nativeEvent.layout.width
    textInputElementWidthRef.current = width
  }, [])

  const onSetFontSize = useCallback(
    (amount: string) => {
      const stringWidth = getStringWidth(amount, maxCharWidthAtMaxFontSize, fontSize, maxFontSize)
      const scaledSize = fontSize * (textInputElementWidthRef.current / stringWidth)
      // If scaledSize = 0 then onLayout hasn't triggered yet and we should default to the largest size
      const scaledSizeWithMin = scaledSize ? Math.max(scaledSize, minFontSize) : maxFontSize
      const newFontSize = Math.round(Math.min(maxFontSize, scaledSizeWithMin))
      setFontSize(newFontSize)
    },
    [fontSize, maxFontSize, minFontSize, maxCharWidthAtMaxFontSize]
  )

  return { onLayout, fontSize, onSetFontSize }
}

const getStringWidth = (
  value: string,
  maxCharWidthAtMaxFontSize: number,
  currentFontSize: number,
  maxFontSize: number
): number => {
  const widthAtMaxFontSize = value.length * maxCharWidthAtMaxFontSize
  return widthAtMaxFontSize * (currentFontSize / maxFontSize)
}
