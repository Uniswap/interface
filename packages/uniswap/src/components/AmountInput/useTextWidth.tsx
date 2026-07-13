import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'

// Padding added to width for cursor visibility
const CURSOR_PADDING_PX = 3

/**
 * Measures text width with instant estimation and optional layout refinement.
 *
 * @params useLayoutOnly - decide whether we should use measurements from onLayout only.
 * If false, we firstly estimate the width, then we use measured width from onLayout event.
 * @params fontSize - when set, pixel `measuredWidth` is not reused after a font change; the
 * width estimate scales the last px-per-character ratio by fontSize / fontSizeAtLastLayout
 * until the next onLayout (avoids a full-width flash when ratio would otherwise be cleared).
 */
export function useTextWidth({
  text,
  maxWidth,
  enabled,
  useLayoutOnly = false,
  fontSize,
}: {
  text: string
  maxWidth?: number
  enabled?: boolean
  useLayoutOnly?: boolean
  fontSize?: number
}): { width: number | undefined; onLayout: (e: LayoutChangeEvent) => void } {
  // Calibrated width-per-character ratio
  const calibratedRatioRef = useRef<number | undefined>(undefined)
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(undefined)

  // Track text length to detect when measurement needs update
  const lastMeasuredLengthRef = useRef<number>(0)
  const lastLayoutFontSizeRef = useRef<number | undefined>(undefined)

  useLayoutEffect(() => {
    if (!enabled) {
      setMeasuredWidth(undefined)
    }
  }, [enabled])

  if (!enabled) {
    // Keep calibratedRatioRef + lastLayoutFontSizeRef so fiat→crypto→fiat can estimate
    // immediately from the last layout instead of dropping width (flex grow = too wide).
    lastMeasuredLengthRef.current = -1
  }

  const isLengthStale = text.length !== lastMeasuredLengthRef.current
  const isFontMetricsStale =
    fontSize !== undefined && lastLayoutFontSizeRef.current !== undefined && lastLayoutFontSizeRef.current !== fontSize

  const isMeasurementStale = isLengthStale || isFontMetricsStale

  const estimatedWidth = useMemo(() => {
    // For text.length === 0, let width be undefined (placeholder sizing handled by parent)
    if (!enabled || useLayoutOnly || text.length === 0) {
      return undefined
    }

    const calibratedRatio = calibratedRatioRef.current
    if (calibratedRatio === undefined) {
      return undefined
    }

    const layoutFontSize = lastLayoutFontSizeRef.current
    let ratio = calibratedRatio
    if (fontSize !== undefined && layoutFontSize !== undefined && layoutFontSize > 0) {
      ratio = calibratedRatio * (fontSize / layoutFontSize)
    }

    return text.length * ratio + CURSOR_PADDING_PX
  }, [enabled, fontSize, useLayoutOnly, text])

  const width = useMemo(() => {
    if (!enabled) {
      return undefined
    }

    if (useLayoutOnly) {
      // only use measured width (returns undefined until first onLayout)
      return measuredWidth !== undefined && maxWidth !== undefined ? Math.min(measuredWidth, maxWidth) : measuredWidth
    }

    // use measurement if fresh, otherwise fall back to estimation
    const rawWidth = !isMeasurementStale && measuredWidth !== undefined ? measuredWidth : estimatedWidth

    if (rawWidth === undefined) {
      return undefined
    }

    return maxWidth !== undefined ? Math.min(rawWidth, maxWidth) : rawWidth
  }, [enabled, useLayoutOnly, measuredWidth, estimatedWidth, maxWidth, isMeasurementStale])

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (!enabled) {
        return
      }

      const actualWidth = e.nativeEvent.layout.width + CURSOR_PADDING_PX

      // Update measurement and track what length / font it corresponds to
      setMeasuredWidth(actualWidth)
      lastMeasuredLengthRef.current = text.length
      if (fontSize !== undefined) {
        lastLayoutFontSizeRef.current = fontSize
      }

      const charCount = text.length
      if (charCount > 0 && !useLayoutOnly) {
        calibratedRatioRef.current = actualWidth / charCount
      }
    },
    [enabled, fontSize, useLayoutOnly, text.length],
  )

  return { width, onLayout }
}
