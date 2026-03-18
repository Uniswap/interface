import type { UTCTimestamp } from 'lightweight-charts'

export function calculateRangePaddingUnits(params: {
  priceScaleFactor: number
  defaultFactor?: number
  padUnits?: number
}): number {
  const { priceScaleFactor, defaultFactor = 10_000, padUnits = 25 } = params
  const baselinePricePadding = padUnits / defaultFactor
  const scaledPadding = Math.round(baselinePricePadding * priceScaleFactor)
  return Math.max(1, scaledPadding)
}

export function constrainVisibleRangeToBounds(params: {
  currentFrom: number
  currentTo: number
  fullFrom: number
  fullTo: number
  minRangeUnits?: number
}): { corrected: boolean; from: UTCTimestamp; to: UTCTimestamp } {
  let { currentFrom: from, currentTo: to } = params
  const { fullFrom, fullTo, minRangeUnits } = params
  let currentRangeSize = to - from

  let needsCorrection = false

  // Enforce minimum range by expanding around the midpoint.
  // Note: The expanded range may temporarily exceed fullFrom/fullTo bounds here,
  // but the subsequent boundary checks (lines 39-54) will correct this.
  if (minRangeUnits && Number.isFinite(minRangeUnits) && minRangeUnits > 0) {
    const fullRangeSize = fullTo - fullFrom
    const clampedMinRange = Math.min(minRangeUnits, fullRangeSize)
    if (currentRangeSize < clampedMinRange) {
      const midpoint = (from + to) / 2
      from = midpoint - clampedMinRange / 2
      to = midpoint + clampedMinRange / 2
      currentRangeSize = to - from
      needsCorrection = true
    }
  }

  if (from < fullFrom) {
    from = fullFrom
    to = from + currentRangeSize
    needsCorrection = true
  }

  if (to > fullTo) {
    to = fullTo
    from = to - currentRangeSize
    needsCorrection = true
  }

  if (from < fullFrom) {
    from = fullFrom
    needsCorrection = true
  }

  return { corrected: needsCorrection, from: from as UTCTimestamp, to: to as UTCTimestamp }
}
