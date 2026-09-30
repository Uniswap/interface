import { area, curveCardinal, line } from 'd3-shape'

export type ChartPoint = { timestamp: number; value: number }

const CURVE = curveCardinal.tension(0.9)

/** Keeps each time bucket's extrema in their original order, plus both endpoints. */
function sampleChartPoints({
  data,
  maxPoints,
  minT,
  rangeT,
}: {
  data: ChartPoint[]
  maxPoints: number
  minT: number
  rangeT: number
}): ChartPoint[] {
  // Four points are needed to retain both endpoints and the global minimum/maximum.
  const pointLimit = Math.max(4, Math.floor(maxPoints))
  if (!Number.isFinite(pointLimit) || data.length <= pointLimit) {
    return data
  }

  const bucketCount = Math.floor((pointLimit - 2) / 2)
  const buckets: ({ min: ChartPoint; max: ChartPoint; minIndex: number; maxIndex: number } | undefined)[] = []
  for (let i = 1; i < data.length - 1; i++) {
    const point = data[i]
    if (!point) {
      continue
    }
    const bucketIndex = Math.min(bucketCount - 1, Math.floor(((point.timestamp - minT) / rangeT) * bucketCount))
    const bucket = buckets[bucketIndex]
    if (!bucket) {
      buckets[bucketIndex] = { min: point, max: point, minIndex: i, maxIndex: i }
      continue
    }
    if (point.value < bucket.min.value) {
      bucket.min = point
      bucket.minIndex = i
    }
    if (point.value > bucket.max.value) {
      bucket.max = point
      bucket.maxIndex = i
    }
  }

  const first = data[0]
  const last = data[data.length - 1]
  const sampled = first ? [first] : []
  for (const bucket of buckets) {
    if (!bucket) {
      continue
    }
    if (bucket.minIndex === bucket.maxIndex) {
      sampled.push(bucket.min)
    } else if (bucket.minIndex < bucket.maxIndex) {
      sampled.push(bucket.min, bucket.max)
    } else {
      sampled.push(bucket.max, bucket.min)
    }
  }
  if (last) {
    sampled.push(last)
  }
  return sampled
}

export interface ChartPathsResult {
  linePath: string | null
  areaPath: string | null
  lastPoint: { x: number; y: number } | null
  /** Full-resolution timestamps in the input's chronological order, preserving source indices. */
  timestamps: { minT: number; rangeT: number; values: number[] } | null
}

export function computeChartPaths({
  data,
  dataWidth,
  height,
  yGutter,
  maxPoints,
}: {
  /** Points in non-decreasing timestamp order. */
  data: ChartPoint[]
  dataWidth: number
  height: number
  yGutter: number
  /** Optional geometry budget (minimum 4); scrub metadata always retains every source point. */
  maxPoints?: number
}): ChartPathsResult {
  if (data.length < 2) {
    return { linePath: null, areaPath: null, lastPoint: null, timestamps: null }
  }

  const first = data[0]
  if (!first) {
    return { linePath: null, areaPath: null, lastPoint: null, timestamps: null }
  }

  let minT = first.timestamp
  let maxT = minT
  let minV = first.value
  let maxV = minV
  for (let i = 1; i < data.length; i++) {
    const point = data[i]
    if (!point) {
      continue
    }
    const { timestamp, value } = point
    if (timestamp < minT) {
      minT = timestamp
    }
    if (timestamp > maxT) {
      maxT = timestamp
    }
    if (value < minV) {
      minV = value
    }
    if (value > maxV) {
      maxV = value
    }
  }

  const rangeT = maxT - minT || 1
  const rangeV = maxV - minV || 1
  const pathData = maxPoints === undefined ? data : sampleChartPoints({ data, maxPoints, minT, rangeT })

  const scaleX = (t: number): number => ((t - minT) / rangeT) * dataWidth
  const scaleY = (v: number): number => yGutter + ((maxV - v) / rangeV) * (height - yGutter * 2)

  const lineGenerator = line<ChartPoint>()
    .x((d) => scaleX(d.timestamp))
    .y((d) => scaleY(d.value))
    .curve(CURVE)

  const areaGenerator = area<ChartPoint>()
    .x((d) => scaleX(d.timestamp))
    .y0(height)
    .y1((d) => scaleY(d.value))
    .curve(CURVE)

  const last = data[data.length - 1]

  return {
    linePath: lineGenerator(pathData),
    areaPath: areaGenerator(pathData),
    lastPoint: last ? { x: scaleX(last.timestamp), y: scaleY(last.value) } : null,
    timestamps: { minT, rangeT, values: data.map((d) => d.timestamp) },
  }
}
