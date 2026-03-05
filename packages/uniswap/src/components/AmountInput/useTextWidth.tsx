import { useCallback, useMemo, useRef, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'

// Padding added to width for cursor visibility
const CURSOR_PADDING_PX = 3

/**
 * Measures text width with instant estimation and optional layout refinement.
 *
 * @params useLayoutOnly - decide whether we should use measurements from onLayout only.
 * If false, we firstly estimate the width, then we use measured width from onLayout event.
 */
export function useTextWidth({
  text,
  maxWidth,
  enabled,
  useLayoutOnly = false,
}: {
  text: string
  maxWidth?: number
  enabled?: boolean
  useLayoutOnly?: boolean
}): { width: number | undefined; onLayout: (e: LayoutChangeEvent) => void } {
  // Calibrated width-per-character ratio
  const calibratedRatioRef = useRef<number | undefined>(undefined)
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(undefined)

  // Track text length to detect when measurement needs update
  const lastMeasuredLengthRef = useRef<number>(0)

  const estimatedWidth = useMemo(() => {
    // For text.length === 0, let width be undefined (placeholder sizing handled by parent)
    if (!enabled || useLayoutOnly || text.length === 0) {
      return undefined
    }

    // Only use calibration if we have estimation - otherwise wait for onLayout
    const calibratedRatio = calibratedRatioRef.current
    if (calibratedRatio === undefined) {
      return undefined
    }

    return text.length * calibratedRatio + CURSOR_PADDING_PX
  }, [enabled, useLayoutOnly, text])

  // Determine if current measurement is stale (text length changed significantly)
  const isMeasurementStale = text.length !== lastMeasuredLengthRef.current

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

      // Update measurement and track what length it corresponds to
      setMeasuredWidth(actualWidth)
      lastMeasuredLengthRef.current = text.length

      const charCount = text.length
      if (charCount > 0 && !useLayoutOnly) {
        calibratedRatioRef.current = actualWidth / charCount
      }
    },
    [enabled, useLayoutOnly, text.length],
  )

  return { width, onLayout }
}
