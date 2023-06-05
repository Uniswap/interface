import { AreaClosed } from '@visx/shape'
import { curveMonotoneX, scaleLinear } from 'd3'
import { useMemo } from 'react'

import { ActivityChartTestData } from './ActivityChartTestData'

interface TimestampedAmount {
  id: string
  timestamp: number
  value: number
  __typename: string
  currency: string
}

const activityHistory = ActivityChartTestData.priceHistory

function getPriceBounds(pricePoints: TimestampedAmount[]): [number, number] {
  const prices = pricePoints.map((x) => x.value)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return [min, max]
}

export function ActivityGraph() {
  // Defining scales
  // x scale
  const timeScale = useMemo(
    () =>
      scaleLinear()
        .domain([activityHistory[0].timestamp, activityHistory[activityHistory.length - 1].timestamp])
        .range([0, 400]),
    []
  )
  // y scale
  const rdScale = useMemo(() => scaleLinear().domain(getPriceBounds(activityHistory)).range([400, 0]), [])

  const getX = useMemo(() => (p: TimestampedAmount) => timeScale(p.timestamp), [timeScale])
  const getY = useMemo(() => (p: TimestampedAmount) => rdScale(p.value), [rdScale])

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
          data={activityHistory}
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
