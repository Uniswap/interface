import { formatNumber } from '@uniswap/conedison/format'
import { localPoint } from '@visx/event'
import { EventType } from '@visx/event/lib/types'
import { GlyphCircle } from '@visx/glyph'
import { AreaClosed, Line } from '@visx/shape'
import { tickFormat } from 'components/Tokens/TokenDetails/PriceChart'
import { bisect, curveMonotoneX, scaleLinear } from 'd3'
import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useCallback, useMemo, useState } from 'react'
import { useTheme } from 'styled-components/macro'

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
  margin?: { top: number; bottom: number; crosshair: number }
  timePeriod: HistoryDuration
}

export function ActivityGraph({
  width,
  height,
  prices,
  margin = { top: 0, bottom: 0, crosshair: 0 },
  timePeriod,
}: ActivityGraphProps) {
  const theme = useTheme()
  const locale = useActiveLocale()

  const graphInnerHeight = height - margin.top - margin.bottom > 0 ? height - margin.top - margin.bottom : 0
  const startingPrice = prices?.[0] ?? DATA_EMPTY
  const endingPrice = prices?.[prices.length - 1] ?? DATA_EMPTY

  const [crosshair, setCrosshair] = useState<number | null>(null)
  const [hoveredPrice, setHoveredPrice] = useState<TimestampedAmount>(endingPrice)

  const crosshairDateFormatter = tickFormat(timePeriod, locale, startingPrice, endingPrice)[1]
  const crosshairEdgeMax = width * 0.85
  const crosshairAtEdge = !!crosshair && crosshair > crosshairEdgeMax

  const timeScale = useMemo(
    () => scaleLinear().domain([startingPrice.timestamp, endingPrice.timestamp]).range([0, width]),
    [startingPrice, endingPrice, width]
  )
  const priceScale = useMemo(
    () =>
      scaleLinear()
        .domain(getPriceBounds(prices ?? []))
        .range([graphInnerHeight, 0]),
    [prices, graphInnerHeight]
  )

  const handleHover = useCallback(
    (event: Element | EventType) => {
      if (!prices) return

      const { x } = localPoint(event) || { x: 0 }
      const x0 = timeScale.invert(x)
      const index = bisect(
        prices.map((x) => x.timestamp),
        x0,
        1
      )

      const d0 = prices[index - 1]
      const d1 = prices[index]
      let pricePoint = d0

      const hasPreviousData = d1 && d1.timestamp
      if (hasPreviousData) {
        pricePoint = x0.valueOf() - d0.timestamp.valueOf() > d1.timestamp.valueOf() - x0.valueOf() ? d1 : d0
      }

      if (pricePoint) {
        setCrosshair(timeScale(pricePoint.timestamp))
        setHoveredPrice(pricePoint)
      }
    },
    [timeScale, prices]
  )

  const resetDisplay = useCallback(() => {
    setCrosshair(null)
    setHoveredPrice(endingPrice)
  }, [endingPrice])

  const getX = useMemo(() => (d: TimestampedAmount) => timeScale(d.timestamp), [timeScale])
  const getY = useMemo(() => (d: TimestampedAmount) => priceScale(d.value), [priceScale])

  return (
    <div style={{ minWidth: '100%' }}>
      <svg width="400" height="400" style={{ minWidth: '100%' }}>
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#1A616F8A" />
            <stop offset="1" stopColor="transparent" />
          </linearGradient>
          <clipPath id="myClip">
            <rect width={width} height={height + 3} />
          </clipPath>
        </defs>
        <AreaClosed<TimestampedAmount>
          data={prices}
          x={(d) => getX(d)}
          y={(d) => getY(d)}
          y0={height + 6}
          yScale={priceScale}
          strokeWidth={3}
          stroke="#014F5F"
          fill="url(#area-gradient)"
          curve={curveMonotoneX}
          clip-path="url(#myClip)"
        />
        {crosshair !== null && (
          <g>
            <text
              x={crosshair + (crosshairAtEdge ? -4 : 4)}
              y={margin.crosshair + 10}
              textAnchor={crosshairAtEdge ? 'end' : 'start'}
              fontSize={12}
              fill={theme.textSecondary}
            >
              {crosshairDateFormatter(hoveredPrice.timestamp)}
            </text>
            <text
              x={crosshair + (crosshairAtEdge ? -4 : 4)}
              y={margin.crosshair + 26}
              textAnchor={crosshairAtEdge ? 'end' : 'start'}
              fontSize={12}
              fill={theme.textSecondary}
            >
              {formatNumber(hoveredPrice.value)} ETH floor
            </text>
            <Line
              from={{ x: crosshair, y: margin.crosshair }}
              to={{ x: crosshair, y: height }}
              stroke={theme.backgroundOutline}
              strokeWidth={1}
              pointerEvents="none"
              strokeDasharray="4,4"
            />
            <GlyphCircle
              left={crosshair}
              top={priceScale(hoveredPrice.value) + margin.top}
              size={50}
              fill="#014F5F"
              stroke="#014F5F"
              strokeWidth={0.5}
            />
          </g>
        )}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
          onTouchStart={handleHover}
          onTouchMove={handleHover}
          onMouseMove={handleHover}
          onMouseLeave={resetDisplay}
        />
      </svg>
    </div>
  )
}
