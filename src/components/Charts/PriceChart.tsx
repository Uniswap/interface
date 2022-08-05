import { localPoint } from '@visx/event'
import { EventType } from '@visx/event/lib/types'
import { GlyphCircle } from '@visx/glyph'
import { Group } from '@visx/group'
import { Line, LinePath } from '@visx/shape'
import { bisect, scaleLinear } from 'd3'
import { radius } from 'd3-curve-circlecorners'
import useTheme from 'hooks/useTheme'
import { useCallback, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'react-feather'
import styled from 'styled-components/macro'

import data from './data.json'

type PricePoint = { value: number; timestamp: number }

function getPriceBounds(pricePoints: PricePoint[]): [number, number] {
  const prices = pricePoints.map((x) => x.value)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return [min, max]
}

const StyledUpArrow = styled(ArrowUpRight)`
  color: ${({ theme }) => theme.accentSuccess};
`
const StyledDownArrow = styled(ArrowDownRight)`
  color: ${({ theme }) => theme.accentFailure};
`

function getDelta(start: number, current: number) {
  const delta = (current / start - 1) * 100
  const isPositive = Math.sign(delta) > 0

  const formattedDelta = delta.toFixed(2) + '%'
  if (isPositive) {
    return ['+' + formattedDelta, <StyledUpArrow size={16} key="arrow-up" />]
  } else if (delta === 0) {
    return [formattedDelta, null]
  }
  return [formattedDelta, <StyledDownArrow size={16} key="arrow-down" />]
}

export const ChartWrapper = styled.div`
  position: relative;
`

export const ChartHeader = styled.div`
  position: absolute;
`

export const TokenPrice = styled.span`
  font-size: 36px;
  line-height: 44px;
`
export const DeltaContainer = styled.div`
  height: 16px;
  display: flex;
  align-items: center;
`
const ArrowCell = styled.div`
  padding-left: 2px;
  display: flex;
`

interface PriceChartProps {
  width: number
  height: number
}

export function PriceChart({ width, height }: PriceChartProps) {
  const margin = { top: 80, bottom: 20, crosshair: 72 }
  // defining inner measurements
  const innerHeight = height - margin.top - margin.bottom
  const theme = useTheme()

  const pricePoints = data.priceHistory
  const startingPrice = pricePoints[0]
  const endingPrice = pricePoints[pricePoints.length - 1]
  const initialState = { pricePoint: endingPrice, xCoordinate: null }

  const [selected, setSelected] = useState<{ pricePoint: PricePoint; xCoordinate: number | null }>(initialState)

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

  const [delta, arrow] = getDelta(startingPrice.value, selected.pricePoint.value)

  return (
    <ChartWrapper>
      <ChartHeader>
        <TokenPrice>${selected.pricePoint.value.toFixed(2)}</TokenPrice>
        <DeltaContainer>
          {delta}
          <ArrowCell>{arrow}</ArrowCell>
        </DeltaContainer>
      </ChartHeader>
      <svg width={width} height={height}>
        {selected.xCoordinate && (
          <g>
            <Line
              from={{ x: selected.xCoordinate, y: margin.crosshair }}
              to={{ x: selected.xCoordinate, y: height }}
              stroke={'#99A1BD3D'}
              strokeWidth={1}
              pointerEvents="none"
              strokeDasharray="4,4"
            />
          </g>
        )}
        <Group top={margin.top}>
          <LinePath
            curve={radius(1)}
            stroke={theme.accentActive}
            strokeWidth={2}
            data={data.priceHistory}
            x={(d: PricePoint) => timeScale(d.timestamp) ?? 0}
            y={(d: PricePoint) => rdScale(d.value) ?? 0}
          />
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
        </Group>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={'transparent'}
          onTouchStart={handleHover}
          onTouchMove={handleHover}
          onMouseMove={handleHover}
          onMouseLeave={() => setSelected(initialState)}
        />
      </svg>
    </ChartWrapper>
  )
}

export default PriceChart
