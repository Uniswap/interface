import { useCallback, useRef, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'

export function useDynamicFontSizing(
  maxCharWidthAtMaxFontSize: number,
  maxFontSize: number,
  minFontSize: number,
): {
  onLayout: (event: LayoutChangeEvent) => void
  fontSize: number
  onSetFontSize: (amount: string) => void
} {
  const [fontSize, setFontSize] = useState(maxFontSize)
  const textInputElementWidthRef = useRef<number | null>(null)

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width
    if (textInputElementWidthRef.current !== width) {
      textInputElementWidthRef.current = width
    }
  }, [])

  const onSetFontSize = useCallback(
    (amount: string) => {
      if (!textInputElementWidthRef.current) return
      
      const stringWidth = getStringWidth(amount, maxCharWidthAtMaxFontSize, fontSize, maxFontSize)
      const scaledSize = fontSize * (textInputElementWidthRef.current / stringWidth)
      const newFontSize = Math.max(minFontSize, Math.min(maxFontSize, Math.round(scaledSize)))
      setFontSize(newFontSize)
    },
    [fontSize, maxFontSize, minFontSize, maxCharWidthAtMaxFontSize],
  )

  return { onLayout, fontSize, onSetFontSize }
}

const getStringWidth = (
  value: string,
  maxCharWidthAtMaxFontSize: number,
  currentFontSize: number,
  maxFontSize: number,
): number => {
  return (value.length * maxCharWidthAtMaxFontSize * currentFontSize) / maxFontSize
}
