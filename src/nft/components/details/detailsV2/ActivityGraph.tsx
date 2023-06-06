import { AreaClosed } from '@visx/shape'
import { curveMonotoneX, scaleLinear } from 'd3'
import { useMemo } from 'react'

interface TimestampedAmount {
  id?: string
  timestamp: number
  value: number
  __typename?: string
  currency?: string
}

const DATA_EMPTY = { value: 0, timestamp: 0 }

function getPriceBounds(pricePoints: TimestampedAmount[]): [number, number] {
  const prices = pricePoints.map((x) => x.value)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return [min, max]
}

interface ActivityGraphProps {
  width: number
  height: number
  prices?: TimestampedAmount[]
  margin?: { top: number; bottom: number }
}

export function ActivityGraph({ width, height, prices, margin = { top: 0, bottom: 0 } }: ActivityGraphProps) {
  const graphInnerHeight = height - margin.top - margin.bottom > 0 ? height - margin.top - margin.bottom : 0

  const startingPrice = prices?.[0] ?? DATA_EMPTY
  const endingPrice = prices?.[prices.length - 1] ?? DATA_EMPTY

  const timeScale = useMemo(
    () => scaleLinear().domain([startingPrice.timestamp, endingPrice.timestamp]).range([0, width]),
    [startingPrice, endingPrice, width]
  )
  const rdScale = useMemo(
    () =>
      scaleLinear()
        .domain(getPriceBounds(prices ?? []))
        .range([graphInnerHeight, 0]),
    [prices, graphInnerHeight]
  )

  const getX = useMemo(() => (d: TimestampedAmount) => timeScale(d.timestamp), [timeScale])
  const getY = useMemo(() => (d: TimestampedAmount) => rdScale(d.value), [rdScale])

  return (
    <div style={{ minWidth: '100%' }}>
      <svg width="400" height="400" style={{ minWidth: '100%' }}>
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#1A616F8A" />
            <stop offset="1" stopColor="transparent" />
          </linearGradient>
        </defs>
        <AreaClosed<TimestampedAmount>
          data={prices}
          x={(d) => getX(d)}
          y={(d) => getY(d)}
          yScale={rdScale}
          strokeWidth={3}
          stroke="#014F5F"
          fill="url(#area-gradient)"
          curve={curveMonotoneX}
        />
      </svg>
    </div>
  )
}
