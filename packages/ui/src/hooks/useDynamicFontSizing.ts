import { useCallback, useRef, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'

export interface FontSizeOptions {
  maxCharWidthAtMaxFontSize: number
  maxFontSize: number
  minFontSize: number
  maxWidth?: number
}

export function useDynamicFontSizing({
  maxCharWidthAtMaxFontSize,
  maxFontSize,
  minFontSize,
  maxWidth,
}: FontSizeOptions): {
  onLayout: (event: LayoutChangeEvent) => void
  onExtraElementLayout: (event: LayoutChangeEvent) => void
  fontSize: number
  onSetFontSize: (amount: string) => void
} {
  const [fontSize, setFontSize] = useState(maxFontSize)
  const textInputElementWidthRef = useRef(0)
  const extraElementWidthRef = useRef(0)

  const onExtraElementLayout = useCallback((event: LayoutChangeEvent) => {
    extraElementWidthRef.current = event.nativeEvent.layout.width
  }, [])

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (textInputElementWidthRef.current) {
        return
      }

      const width = event.nativeEvent.layout.width
      textInputElementWidthRef.current = maxWidth ? Math.min(width, maxWidth) : width
    },
    [maxWidth],
  )

  const onSetFontSize = useCallback(
    (amount: string) => {
      const stringWidth = getStringWidth({
        value: amount,
        maxCharWidthAtMaxFontSize,
        currentFontSize: fontSize,
        maxFontSize,
      })
      const scaledSize = fontSize * ((textInputElementWidthRef.current - extraElementWidthRef.current) / stringWidth)
      // If scaledSize = 0 then onLayout hasn't triggered yet and we should default to the largest size
      const scaledSizeWithMin = scaledSize ? Math.max(scaledSize, minFontSize) : maxFontSize
      const newFontSize = Math.round(Math.min(maxFontSize, scaledSizeWithMin))
      setFontSize(newFontSize)
    },
    [fontSize, maxFontSize, minFontSize, maxCharWidthAtMaxFontSize],
  )

  return { onLayout, fontSize, onSetFontSize, onExtraElementLayout }
}

function getStringWidth({
  value,
  maxCharWidthAtMaxFontSize,
  currentFontSize,
  maxFontSize,
}: {
  value: string
  maxCharWidthAtMaxFontSize: number
  currentFontSize: number
  maxFontSize: number
}): number {
  const widthAtMaxFontSize = value.length * maxCharWidthAtMaxFontSize
  return widthAtMaxFontSize * (currentFontSize / maxFontSize)
}
