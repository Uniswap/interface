import type { IChartApi, UTCTimestamp } from 'lightweight-charts'

export function recenterRangeOnBid({
  chart,
  priceScaleFactor,
  bidPriceDecimal,
  minTime,
  maxTime,
  offsetRatio = 0.3,
  onExtendRangeRequired,
}: {
  chart: IChartApi
  priceScaleFactor: number
  bidPriceDecimal: number
  minTime: number | null
  maxTime: number | null
  offsetRatio?: number
  /** Callback triggered when bid is above maxTime and chart needs to extend to show it */
  onExtendRangeRequired?: (bidTickDecimal: number) => void
}): void {
  const timeScale = chart.timeScale()
  let visibleRange
  try {
    visibleRange = timeScale.getVisibleRange()
  } catch {
    return
  }
  if (!visibleRange) {
    return
  }

  const scaledBidTime = Math.round(bidPriceDecimal * priceScaleFactor)
  if (!Number.isFinite(scaledBidTime) || !Number.isSafeInteger(scaledBidTime)) {
    return
  }

  // If bid is outside the chart data range, handle accordingly
  if (minTime !== null && maxTime !== null) {
    if (scaledBidTime > maxTime) {
      // Bid is above the chart range - trigger extension callback instead of returning
      onExtendRangeRequired?.(bidPriceDecimal)
      return
    }
    if (scaledBidTime < minTime) {
      // Below floor - can't extend downward
      return
    }
  }

  const currentFrom = visibleRange.from as number
  const currentTo = visibleRange.to as number
  if (!Number.isFinite(currentFrom) || !Number.isFinite(currentTo)) {
    return
  }
  const rangeSize = currentTo - currentFrom
  if (!Number.isFinite(rangeSize) || rangeSize <= 0) {
    return
  }

  // IMPORTANT: lightweight-charts expects finite integer timestamps. Never pass floats.
  const safeOffsetRatio = Number.isFinite(offsetRatio) ? Math.min(1, Math.max(0, offsetRatio)) : 0.3
  let newFrom = Math.round(scaledBidTime - rangeSize * safeOffsetRatio)
  let newTo = Math.round(newFrom + rangeSize)

  // Clamp to data bounds when available to ensure the range intersects the series.
  if (minTime !== null && maxTime !== null) {
    const minBound = Math.min(minTime, maxTime)
    const maxBound = Math.max(minTime, maxTime)
    if (newFrom < minBound) {
      const delta = minBound - newFrom
      newFrom = minBound
      newTo += delta
    }
    if (newTo > maxBound) {
      const delta = newTo - maxBound
      newTo = maxBound
      newFrom -= delta
    }

    // Ensure non-zero window after clamping.
    if (newTo === newFrom) {
      if (newTo < maxBound) {
        newTo = newTo + 1
      } else if (newFrom > minBound) {
        newFrom = newFrom - 1
      }
    }
  }

  if (!Number.isSafeInteger(newFrom) || !Number.isSafeInteger(newTo) || newTo <= newFrom) {
    return
  }

  timeScale.setVisibleRange({
    from: newFrom as UTCTimestamp,
    to: newTo as UTCTimestamp,
  })
}
