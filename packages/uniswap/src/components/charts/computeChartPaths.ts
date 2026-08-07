import { area, curveCardinal, line } from 'd3-shape'

export type ChartPoint = { timestamp: number; value: number }

const CURVE = curveCardinal.tension(0.9)

export interface ChartPathsResult {
  linePath: string | null
  areaPath: string | null
  lastPoint: { x: number; y: number } | null
  timestamps: { minT: number; rangeT: number; values: number[] } | null
}

export function computeChartPaths({
  data,
  dataWidth,
  height,
  yGutter,
}: {
  data: ChartPoint[]
  dataWidth: number
  height: number
  yGutter: number
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
    linePath: lineGenerator(data),
    areaPath: areaGenerator(data),
    lastPoint: last ? { x: scaleX(last.timestamp), y: scaleY(last.value) } : null,
    timestamps: { minT, rangeT, values: data.map((d) => d.timestamp) },
  }
}
