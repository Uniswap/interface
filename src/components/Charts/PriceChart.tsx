//import { AxisBottom, AxisLeft } from '@visx/axis'
import { localPoint } from '@visx/event'
import { EventType } from '@visx/event/lib/types'
import { GlyphCircle } from '@visx/glyph'
import { Group } from '@visx/group'
import { Line, LinePath } from '@visx/shape'
import { bisect, scaleLinear } from 'd3'
import { useCallback, useEffect, useState } from 'react'

import circleCorners from './circleCorners'
import data from './data.json'

// Defining selector functions
type PricePoint = { value: number; timestamp: number }

function getMin(priceHistory: PricePoint[]) {
  return priceHistory.reduce((r, e) => (r.value < e.value ? r : e)).value
}

function getMax(priceHistory: PricePoint[]) {
  return priceHistory.reduce((r, e) => (r.value > e.value ? r : e)).value
}

function getDelta(start: number, current: number) {
  return (current / start - 1) * 100
}

interface PriceChartProps {
  width: number
  height: number
  setTokenNumbers: (price: number, delta: number | undefined) => void
}

export function PriceChart({ setTokenNumbers, width, height }: PriceChartProps) {
  const margin = { top: 40, bottom: 50 }
  // defining inner measurements
  const innerHeight = height - margin.top - margin.bottom

  const pricePoints = data.priceHistory
  const startingPrice = pricePoints[0]
  const endingPrice = pricePoints[pricePoints.length - 1]
  const initialState = { pricePoint: endingPrice, xCordinate: null }

  const [selected, setSelected] = useState<{ pricePoint: PricePoint; xCordinate: number | null }>(initialState)

  useEffect(() => {
    setTokenNumbers(selected.pricePoint.value, getDelta(startingPrice.value, selected.pricePoint.value))
  }, [setTokenNumbers, selected, startingPrice])

  // Defining scales
  // x scale
  const timeScale = scaleLinear().domain([startingPrice.timestamp, endingPrice.timestamp]).range([0, width])

  // y scale
  const rdScale = scaleLinear()
    .domain([getMin(data.priceHistory), getMax(data.priceHistory)])
    .range([innerHeight, 0])

  const handleTooltip = useCallback(
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
      // is previous data point available?
      if (d1 && d1.timestamp) {
        pricePoint = x0.valueOf() - d0.timestamp.valueOf() > d1.timestamp.valueOf() - x0.valueOf() ? d1 : d0
      }

      setSelected({ pricePoint, xCordinate: x })
    },
    [timeScale]
  )

  return (
    <svg width={width} height={height}>
      <Group top={margin.top}>
        <LinePath
          curve={circleCorners.radius(1)}
          stroke={'#627EEA'}
          strokeWidth={2}
          data={data.priceHistory}
          x={(d: PricePoint) => timeScale(d.timestamp) ?? 0}
          y={(d: PricePoint) => rdScale(d.value) ?? 0}
        />
        {selected.xCordinate && (
          <g>
            <Line
              from={{ x: selected.xCordinate, y: 0 }}
              to={{ x: selected.xCordinate, y: height }}
              stroke={'#99A1BD3D'}
              strokeWidth={2}
              pointerEvents="none"
              strokeDasharray="4,4"
            />
          </g>
        )}
        {selected.xCordinate && (
          <g>
            <GlyphCircle
              left={selected.xCordinate}
              top={rdScale(selected.pricePoint.value)}
              size={50}
              fill={'#627EEA'}
              stroke={'#99A1BD3D'}
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
          onTouchStart={handleTooltip}
          onTouchMove={handleTooltip}
          onMouseMove={handleTooltip}
          onMouseLeave={() => setSelected(initialState)}
        />
      </Group>
    </svg>
  )
}

export default PriceChart
