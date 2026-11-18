/**
 * One bucket of volume, starting at `time` (seconds) and running to the next bucket's start. Structural, so the
 * chart's `SingleHistogramData` bars fit as they are.
 */
type VolumeBar = { time: number; value: number }

/** A time the chart can place, and where it sits across the pane. */
export type TimeAnchor = { time: number; x: number }

/** A bar as drawn; `time` is its bucket's start, and `span` the width of its bucket, gap included. */
export type VolumeBarRect = { time: number; x: number; width: number; span: number; height: number }

// The share of each bucket's width left as a gap before the next bar.
const BAR_GAP_SHARE = 0.2

/**
 * The anchors with one more at each end, half the neighbouring step out. Candles are drawn centred on their
 * timestamps, so the first and last reach half a candle past them, and volume under those halves needs
 * somewhere to land rather than being clipped.
 */
export function padAnchorsByHalfStep(anchors: readonly TimeAnchor[]): TimeAnchor[] {
  if (anchors.length < 2) {
    return [...anchors]
  }
  const [first, second] = anchors
  const last = anchors[anchors.length - 1]
  const beforeLast = anchors[anchors.length - 2]
  const halfway = (a: TimeAnchor, b: TimeAnchor): TimeAnchor => ({
    time: a.time + (a.time - b.time) / 2,
    x: a.x + (a.x - b.x) / 2,
  })
  return [halfway(first, second), ...anchors, halfway(last, beforeLast)]
}

/** Where `time` falls across the pane, interpolated between the anchors either side; clamped to their span. */
function timeToX(time: number, anchors: TimeAnchor[]): number {
  const first = anchors[0]
  const last = anchors[anchors.length - 1]
  if (time <= first.time) {
    return first.x
  }
  if (time >= last.time) {
    return last.x
  }
  let low = 0
  let high = anchors.length - 1
  while (high - low > 1) {
    const mid = (low + high) >> 1
    if (anchors[mid].time <= time) {
      low = mid
    } else {
      high = mid
    }
  }
  const before = anchors[low]
  const after = anchors[high]
  return before.x + ((time - before.time) / (after.time - before.time)) * (after.x - before.x)
}

/**
 * Each bucket as a bar across the stretch of the pane its time span covers, scaled so the largest bucket
 * reaches `maxHeight`. The volume buckets needn't share the price's timestamps, so their positions come from
 * the price points' (`anchors`, sorted by time); a bucket outside the price's span is clipped to it.
 */
export function getVolumeBarRects({
  bars,
  anchors,
  maxHeight,
}: {
  bars: VolumeBar[]
  anchors: TimeAnchor[]
  maxHeight: number
}): VolumeBarRect[] {
  const maxValue = Math.max(0, ...bars.map((bar) => bar.value))
  if (anchors.length < 2 || maxValue === 0) {
    return []
  }
  const rects: VolumeBarRect[] = []
  bars.forEach((bar, index) => {
    const next = bars[index + 1] as VolumeBar | undefined
    const previous = bars[index - 1] as VolumeBar | undefined
    // The last bucket runs as long as the one before it.
    const end = next?.time ?? bar.time + (previous ? bar.time - previous.time : 0)
    const startX = timeToX(bar.time, anchors)
    const span = timeToX(end, anchors) - startX
    if (span <= 0 || bar.value <= 0) {
      return
    }
    rects.push({
      time: bar.time,
      x: startX,
      span,
      width: Math.max(1, span * (1 - BAR_GAP_SHARE)),
      height: (bar.value / maxValue) * maxHeight,
    })
  })
  return rects
}

/**
 * The bar whose bucket spans `x` across the pane, gap included. A quiet bucket has no bar, so the pointer over
 * one picks nothing rather than a neighbour's volume.
 */
export function findBarRectAt(rects: readonly VolumeBarRect[], x: number): VolumeBarRect | undefined {
  return rects.find((rect) => x >= rect.x && x < rect.x + rect.span)
}
