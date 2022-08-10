import { AxisBottom, TickFormatter } from '@visx/axis'
import { localPoint } from '@visx/event'
import { EventType } from '@visx/event/lib/types'
import { GlyphCircle } from '@visx/glyph'
import { Line } from '@visx/shape'
import { filterTimeAtom } from 'components/Explore/state'
import { bisect, curveBasis, NumberValue, scaleLinear } from 'd3'
import { useActiveLocale } from 'hooks/useActiveLocale'
import useTheme from 'hooks/useTheme'
import { TimePeriod } from 'hooks/useTopTokens'
import { useAtom } from 'jotai'
import { useCallback, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'react-feather'
import styled from 'styled-components/macro'
import {
  dayHourFormatter,
  hourFormatter,
  monthDayFormatter,
  monthFormatter,
  monthYearDayFormatter,
  monthYearFormatter,
  weekFormatter,
} from 'utils/formatChartTimes'

import data from './data.json'
import LineChart from './LineChart'

// TODO: This should be combined with the logic in TimeSelector.
const TIME_DISPLAYS: [TimePeriod, string][] = [
  [TimePeriod.hour, '1H'],
  [TimePeriod.day, '1D'],
  [TimePeriod.week, '1W'],
  [TimePeriod.month, '1M'],
  [TimePeriod.year, '1Y'],
  [TimePeriod.all, 'ALL'],
]

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
  overflow: visible;
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
export const TimeOptionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  gap: 4px;
`
const TimeButton = styled.button<{ active: boolean }>`
  background-color: ${({ theme, active }) => (active ? theme.accentActive : 'transparent')};
  font-size: 14px;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.textPrimary};
`

function getTicks(startTimestamp: number, endTimestamp: number, numTicks = 5) {
  return Array.from(
    { length: numTicks },
    (v, i) => endTimestamp - ((endTimestamp - startTimestamp) / (numTicks + 1)) * (i + 1)
  )
}

function tickFormat(
  startTimestamp: number,
  endTimestamp: number,
  timePeriod: TimePeriod,
  locale: string
): [TickFormatter<NumberValue>, (v: number) => string, number[]] {
  switch (timePeriod) {
    case TimePeriod.hour:
      return [hourFormatter(locale), dayHourFormatter(locale), getTicks(startTimestamp, endTimestamp)]
    case TimePeriod.day:
      return [hourFormatter(locale), dayHourFormatter(locale), getTicks(startTimestamp, endTimestamp)]
    case TimePeriod.week:
      return [weekFormatter(locale), dayHourFormatter(locale), getTicks(startTimestamp, endTimestamp, 6)]
    case TimePeriod.month:
      return [monthDayFormatter(locale), dayHourFormatter(locale), getTicks(startTimestamp, endTimestamp)]
    case TimePeriod.year:
      return [monthFormatter(locale), monthYearDayFormatter(locale), getTicks(startTimestamp, endTimestamp)]
    case TimePeriod.all:
      return [monthYearFormatter(locale), monthYearDayFormatter(locale), getTicks(startTimestamp, endTimestamp)]
  }
}

const margin = { top: 86, bottom: 32, crosshair: 72 }
const timeOptionsHeight = 44
const crosshairDateOverhang = 80

interface PriceChartProps {
  width: number
  height: number
}

export function PriceChart({ width, height }: PriceChartProps) {
  const [timePeriod, setTimePeriod] = useAtom(filterTimeAtom)
  const locale = useActiveLocale()
  const theme = useTheme()

  /* TODO: Implement API calls & cache to use here */
  const pricePoints = data[timePeriod]
  const startingPrice = pricePoints[0]
  const endingPrice = pricePoints[pricePoints.length - 1]
  const initialState = { pricePoint: endingPrice, xCoordinate: null }
  const [selected, setSelected] = useState<{ pricePoint: PricePoint; xCoordinate: number | null }>(initialState)

  const graphWidth = width + crosshairDateOverhang
  const graphHeight = height - timeOptionsHeight
  const graphInnerHeight = graphHeight - margin.top - margin.bottom

  // Defining scales
  // x scale
  const timeScale = scaleLinear().domain([startingPrice.timestamp, endingPrice.timestamp]).range([0, width])
  // y scale
  const rdScale = scaleLinear().domain(getPriceBounds(pricePoints)).range([graphInnerHeight, 0])

  const handleHover = useCallback(
    (event: Element | EventType) => {
      const { x } = localPoint(event) || { x: 0 }
      const x0 = timeScale.invert(x) // get timestamp from the scale
      const index = bisect(
        pricePoints.map((x) => x.timestamp),
        x0,
        1
      )

      const d0 = pricePoints[index - 1]
      const d1 = pricePoints[index]
      let pricePoint = d0

      const hasPreviousData = d1 && d1.timestamp
      if (hasPreviousData) {
        pricePoint = x0.valueOf() - d0.timestamp.valueOf() > d1.timestamp.valueOf() - x0.valueOf() ? d1 : d0
      }

      setSelected({ pricePoint, xCoordinate: timeScale(pricePoint.timestamp) })
    },
    [timeScale, pricePoints]
  )

  const [tickFormatter, crosshairDateFormatter, ticks] = tickFormat(
    startingPrice.timestamp,
    endingPrice.timestamp,
    timePeriod,
    locale
  )
  const [delta, arrow] = getDelta(startingPrice.value, selected.pricePoint.value)
  const crosshairEdgeMax = width * 0.97
  const crosshairAtEdge = !!selected.xCoordinate && selected.xCoordinate > crosshairEdgeMax

  return (
    <ChartWrapper>
      <ChartHeader>
        <TokenPrice>${selected.pricePoint.value.toFixed(2)}</TokenPrice>
        <DeltaContainer>
          {delta}
          <ArrowCell>{arrow}</ArrowCell>
        </DeltaContainer>
      </ChartHeader>
      <LineChart
        data={pricePoints}
        getX={(p: PricePoint) => timeScale(p.timestamp)}
        getY={(p: PricePoint) => rdScale(p.value)}
        marginTop={margin.top}
        /* Default curve doesn't look good for the ALL chart */
        curve={timePeriod === TimePeriod.all ? curveBasis : undefined}
        strokeWidth={2}
        width={graphWidth}
        height={graphHeight}
      >
        <AxisBottom
          scale={timeScale}
          stroke={theme.backgroundOutline}
          tickFormat={tickFormatter}
          tickStroke={theme.backgroundOutline}
          tickLength={4}
          tickTransform={'translate(0 -5)'}
          tickValues={ticks}
          top={graphHeight - 1}
          tickLabelProps={() => ({
            fill: theme.textSecondary,
            fontSize: 12,
            textAnchor: 'middle',
            transform: 'translate(0 -24)',
          })}
        />
        {selected.xCoordinate !== null && (
          <g>
            <text
              x={selected.xCoordinate + (crosshairAtEdge ? -4 : 4)}
              y={margin.crosshair + 10}
              textAnchor={crosshairAtEdge ? 'end' : 'start'}
              fontSize={12}
              fill={theme.textSecondary}
            >
              {crosshairDateFormatter(selected.pricePoint.timestamp)}
            </text>
            <Line
              from={{ x: selected.xCoordinate, y: margin.crosshair }}
              to={{ x: selected.xCoordinate, y: graphHeight }}
              stroke={theme.backgroundOutline}
              strokeWidth={1}
              pointerEvents="none"
              strokeDasharray="4,4"
            />
            <GlyphCircle
              left={selected.xCoordinate}
              top={rdScale(selected.pricePoint.value) + margin.top}
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
          height={graphHeight}
          fill={'transparent'}
          onTouchStart={handleHover}
          onTouchMove={handleHover}
          onMouseMove={handleHover}
          onMouseLeave={() => setSelected(initialState)}
        />
      </LineChart>
      <TimeOptionsContainer>
        {TIME_DISPLAYS.map(([value, display]) => (
          <TimeButton key={display} active={timePeriod === value} onClick={() => setTimePeriod(value)}>
            {display}
          </TimeButton>
        ))}
      </TimeOptionsContainer>
    </ChartWrapper>
  )
}

export default PriceChart
