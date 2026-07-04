import { terminalColors } from '~/terminal/theme/tokens'

/** Direction of a series — drives the stroke colour (green/red/muted). */
export type TrendDirection = 'up' | 'down' | 'flat'

/** Prototype stroke colours: up `#12B866`, down `#EF4E4A`, flat `#8A94A3`. */
export function trendColor(direction: TrendDirection): string {
  switch (direction) {
    case 'up':
      return terminalColors.greenUp
    case 'down':
      return terminalColors.redDown
    case 'flat':
      return terminalColors.ink3
  }
}

/** Derive direction from a series (last vs first point). */
export function trendDirectionOf(data: readonly number[]): TrendDirection {
  if (data.length < 2) {
    return 'flat'
  }
  const first = data[0]
  const last = data[data.length - 1]
  if (last > first) {
    return 'up'
  }
  if (last < first) {
    return 'down'
  }
  return 'flat'
}

export interface SparklineCellProps {
  /** Series values, oldest → newest. Fewer than 2 points renders an empty box (layout preserved). */
  data: readonly number[]
  /** Overrides the auto direction (last vs first) used for the stroke colour. */
  direction?: TrendDirection
  /** Rendered width in px. Prototype sizes: 80 (B3 table), 60 (B10/B11 rows), 46 (B10 stat cards), 90 (B13 KPI). */
  width?: number
  /** Rendered height in px. Prototype sizes: 26 (B3), 22 (B11), 20 (B10 rows), 18 (B10 stat cards), 34 (B13 KPI). */
  height?: number
  /** Stroke width in the 120×34 viewBox space. Prototype: 2 (B3), 2.2 (B11/B13), 2.4 (B10 stat cards). */
  strokeWidth?: number
}

/**
 * Inline SVG sparkline — pixel-perfect to the prototype polylines: a fixed
 * `0 0 120 34` viewBox with `preserveAspectRatio="none"`, values normalised to
 * y ∈ [3, 30] (flat series sit at y 17), stroke coloured by direction
 * (green `#12B866` / red `#EF4E4A` / muted `#8A94A3`). No charting lib.
 */
export function SparklineCell({
  data,
  direction,
  width = 80,
  height = 26,
  strokeWidth = 2,
}: SparklineCellProps): JSX.Element {
  const resolvedDirection = direction ?? trendDirectionOf(data)

  let points = ''
  if (data.length >= 2) {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const span = max - min
    points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 120
        // Higher value → smaller y. Range matches the prototype series (y 3…30).
        const y = span === 0 ? 17 : 30 - ((value - min) / span) * 27
        return `${round2(x)},${round2(y)}`
      })
      .join(' ')
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 34"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {points ? (
        <polyline points={points} fill="none" stroke={trendColor(resolvedDirection)} strokeWidth={strokeWidth} />
      ) : null}
    </svg>
  )
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
