import { localPoint } from '@visx/event'
import { EventType } from '@visx/event/lib/types'
import { GlyphCircle } from '@visx/glyph'
import { Group } from '@visx/group'
import { Line, LinePath } from '@visx/shape'
import { bisect, scaleLinear } from 'd3'
import useTheme from 'hooks/useTheme'
import { atom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { useCallback, useEffect, useState } from 'react'

import circleCorners from './circleCorners'
import data from './data.json'

export const CrosshairPriceAtom = atom<{ value: number; delta: string }>({ value: 0, delta: '+0.00%' })

type PricePoint = { value: number; timestamp: number }

function getPriceBounds(pricePoints: PricePoint[]): [number, number] {
  const prices = pricePoints.map((x) => x.value)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return [min, max]
}

function getDelta(start: number, current: number) {
  const delta = (current / start - 1) * 100
  const isPositive = Math.sign(delta) > 0

  return (isPositive ? '+' : '') + delta.toFixed(2)
}

interface PriceChartProps {
  width: number
  height: number
}

export function PriceChart({ width, height }: PriceChartProps) {
  const margin = { top: 40, bottom: 50 }
  // defining inner measurements
  const innerHeight = height - margin.top - margin.bottom
  const theme = useTheme()

  const pricePoints = data.priceHistory
  const startingPrice = pricePoints[0]
  const endingPrice = pricePoints[pricePoints.length - 1]
  const initialState = { pricePoint: endingPrice, xCoordinate: null }

  const [selected, setSelected] = useState<{ pricePoint: PricePoint; xCoordinate: number | null }>(initialState)
  const setCrosshairPrice = useUpdateAtom(CrosshairPriceAtom)

  useEffect(() => {
    setCrosshairPrice({
      value: selected.pricePoint.value,
      delta: getDelta(startingPrice.value, selected.pricePoint.value),
    })
  }, [setCrosshairPrice, selected, startingPrice])

  // Defining scales
  // x scale
  const timeScale = scaleLinear().domain([startingPrice.timestamp, endingPrice.timestamp]).range([0, width])

  // y scale
  const rdScale = scaleLinear().domain(getPriceBounds(pricePoints)).range([innerHeight, 0])

  const handleHover = useCallback(
    (event: Element | EventType) => {
      const { x } = localPoint(event) || { x: 0 }
      const x0 = timeScale.invert(x) // get timestamp from the scale
      const index = bisect(
        data.priceHistory.map((x) => x.timestamp),
        x0,
        1
      )

      const d0 = data.priceHistory[index - 1]
      const d1 = data.priceHistory[index]
      let pricePoint = d0

      const hasPreviousData = d1 && d1.timestamp
      if (hasPreviousData) {
        pricePoint = x0.valueOf() - d0.timestamp.valueOf() > d1.timestamp.valueOf() - x0.valueOf() ? d1 : d0
      }

      setSelected({ pricePoint, xCoordinate: x })
    },
    [timeScale]
  )

  return (
    <svg width={width} height={height}>
      <Group top={margin.top}>
        <LinePath
          curve={circleCorners.radius(1)}
          stroke={theme.accentActive}
          strokeWidth={2}
          data={data.priceHistory}
          x={(d: PricePoint) => timeScale(d.timestamp) ?? 0}
          y={(d: PricePoint) => rdScale(d.value) ?? 0}
        />
        {selected.xCoordinate && (
          <g>
            <Line
              from={{ x: selected.xCoordinate, y: 0 }}
              to={{ x: selected.xCoordinate, y: height }}
              stroke={'#99A1BD3D'}
              strokeWidth={1}
              pointerEvents="none"
              strokeDasharray="4,4"
            />
          </g>
        )}
        {selected.xCoordinate && (
          <g>
            <GlyphCircle
              left={selected.xCoordinate}
              top={rdScale(selected.pricePoint.value)}
              size={50}
              fill={theme.accentActive}
              stroke={theme.backgroundOutline}
              strokeWidth={2}
            />
          </g>
        )}
        <rect
          x={0}
          y={0}
          width={width}
          height={innerHeight}
          fill={'transparent'}
          onTouchStart={handleHover}
          onTouchMove={handleHover}
          onMouseMove={handleHover}
          onMouseLeave={() => setSelected(initialState)}
        />
      </Group>
    </svg>
  )
}

export default PriceChart
