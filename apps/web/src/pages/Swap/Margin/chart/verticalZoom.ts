export const MAX_VERTICAL_ZOOM_STEP = 3

interface PriceRange {
  minValue: number
  maxValue: number
}

// Vertical-zoom range for the chart's autoscaleInfoProvider: per-side attenuation of the overlay
// headroom (how far autoscale bounds extend beyond the candle range). Step 0 reproduces the legacy
// candles ∪ bounds union exactly; MAX_VERTICAL_ZOOM_STEP is the pure candle-fit range; steps in
// between keep a shrinking fraction of each side's headroom, so a one-sided far liquidation line
// never leaves blank headroom on the opposite side. Linear in prices — invariant to the base
// model's lowPriceRangeScaleFactor space — and never narrower than the candles nor wider than the
// union.
export function zoomedPriceRange({
  candleRange,
  bounds,
  step,
}: {
  candleRange: PriceRange
  bounds: { min: number; max: number }
  step: number
}): PriceRange {
  const clampedStep = Math.min(Math.max(step, 0), MAX_VERTICAL_ZOOM_STEP)
  // Exact legacy union at step 0: the attenuation rearrangement a − (a−b) drifts 1-2 ulp off Math.min.
  if (clampedStep === 0) {
    return {
      minValue: Math.min(candleRange.minValue, bounds.min),
      maxValue: Math.max(candleRange.maxValue, bounds.max),
    }
  }
  const headroomKept = 1 - clampedStep / MAX_VERTICAL_ZOOM_STEP
  return {
    minValue: candleRange.minValue - Math.max(0, candleRange.minValue - bounds.min) * headroomKept,
    maxValue: candleRange.maxValue + Math.max(0, bounds.max - candleRange.maxValue) * headroomKept,
  }
}
