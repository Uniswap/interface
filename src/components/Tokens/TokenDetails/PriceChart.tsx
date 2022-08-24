import { Token } from '@uniswap/sdk-core'
import { AxisBottom, TickFormatter } from '@visx/axis'
import { localPoint } from '@visx/event'
import { EventType } from '@visx/event/lib/types'
import { GlyphCircle } from '@visx/glyph'
import { Line } from '@visx/shape'
import { filterTimeAtom } from 'components/Tokens/state'
import { bisect, curveBasis, NumberValue, scaleLinear } from 'd3'
import { useTokenPriceQuery } from 'graphql/data/TokenPriceQuery'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { TimePeriod } from 'hooks/useExplorePageQuery'
import { useAtom } from 'jotai'
import { useCallback, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { OPACITY_HOVER } from 'theme'
import {
  dayHourFormatter,
  hourFormatter,
  monthDayFormatter,
  monthFormatter,
  monthYearDayFormatter,
  monthYearFormatter,
  weekFormatter,
} from 'utils/formatChartTimes'

import LineChart from '../../Charts/LineChart'
import { DISPLAYS, ORDERED_TIMES } from '../TokenTable/TimeSelector'

// TODO: This should be combined with the logic in TimeSelector.

export type PricePoint = { value: number; timestamp: number }

export const DATA_EMPTY = { value: 0, timestamp: 0 }

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

export function calculateDelta(start: number, current: number) {
  return (current / start - 1) * 100
}

export function getDeltaArrow(delta: number) {
  if (Math.sign(delta) > 0) {
    return <StyledUpArrow size={16} key="arrow-up" />
  } else if (delta === 0) {
    return null
  } else {
    return <StyledDownArrow size={16} key="arrow-down" />
  }
}

export function formatDelta(delta: number) {
  let formattedDelta = delta.toFixed(2) + '%'
  if (Math.sign(delta) > 0) {
    formattedDelta = '+' + formattedDelta
  }
  return formattedDelta
}

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
export const TimeOptionsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`
export const TimeOptionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  gap: 4px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
  height: 40px;
  padding: 4px;
  width: fit-content;
`
const TimeButton = styled.button<{ active: boolean }>`
  background-color: ${({ theme, active }) => (active ? theme.backgroundInteractive : 'transparent')};
  font-weight: 600;
  font-size: 16px;
  padding: 6px 12px;
  border-radius: 12px;
  line-height: 20px;
  border: none;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.textPrimary : theme.textSecondary)};
  :hover {
    ${({ active }) => !active && `opacity: ${OPACITY_HOVER};`}
  }
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
    case TimePeriod.HOUR:
      return [hourFormatter(locale), dayHourFormatter(locale), getTicks(startTimestamp, endTimestamp)]
    case TimePeriod.DAY:
      return [hourFormatter(locale), dayHourFormatter(locale), getTicks(startTimestamp, endTimestamp)]
    case TimePeriod.WEEK:
      return [weekFormatter(locale), dayHourFormatter(locale), getTicks(startTimestamp, endTimestamp, 6)]
    case TimePeriod.MONTH:
      return [monthDayFormatter(locale), dayHourFormatter(locale), getTicks(startTimestamp, endTimestamp)]
    case TimePeriod.YEAR:
      return [monthFormatter(locale), monthYearDayFormatter(locale), getTicks(startTimestamp, endTimestamp)]
    case TimePeriod.ALL:
      return [monthYearFormatter(locale), monthYearDayFormatter(locale), getTicks(startTimestamp, endTimestamp)]
  }
}

const margin = { top: 100, bottom: 48, crosshair: 72 }
const timeOptionsHeight = 44
const crosshairDateOverhang = 80

interface PriceChartProps {
  width: number
  height: number
  token: Token
}

export function PriceChart({ width, height, token }: PriceChartProps) {
  const [timePeriod, setTimePeriod] = useAtom(filterTimeAtom)
  const locale = useActiveLocale()
  const theme = useTheme()

  // TODO: Add network selector input, consider using backend type instead of current front end selector type
  const pricePoints: PricePoint[] = useTokenPriceQuery(token.address, timePeriod, 'ETHEREUM').filter(
    (p): p is PricePoint => Boolean(p && p.value)
  )

  const hasData = pricePoints.length !== 0

  /* TODO: Implement API calls & cache to use here */
  const startingPrice = hasData ? pricePoints[0] : DATA_EMPTY
  const endingPrice = hasData ? pricePoints[pricePoints.length - 1] : DATA_EMPTY
  const [displayPrice, setDisplayPrice] = useState(startingPrice)
  const [crosshair, setCrosshair] = useState<number | null>(null)

  const graphWidth = width + crosshairDateOverhang
  // TODO: remove this logic after suspense is properly added
  const graphHeight = height - timeOptionsHeight > 0 ? height - timeOptionsHeight : 0
  const graphInnerHeight = graphHeight - margin.top - margin.bottom > 0 ? graphHeight - margin.top - margin.bottom : 0

  // Defining scales
  // x scale
  const timeScale = scaleLinear().domain([startingPrice.timestamp, endingPrice.timestamp]).range([0, width])
  // y scale
  const rdScale = scaleLinear().domain(getPriceBounds(pricePoints)).range([graphInnerHeight, 0])

  const handleHover = useCallback(
    (event: Element | EventType) => {
      const { x } = localPoint(event) || { x: 0 }
      const x0 = timeScale.invert(x) // get timestamp from the scalexw
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

      setCrosshair(timeScale(pricePoint.timestamp))
      setDisplayPrice(pricePoint)
    },
    [timeScale, pricePoints]
  )

  const resetDisplay = useCallback(() => {
    setCrosshair(null)
    setDisplayPrice(endingPrice)
  }, [setCrosshair, setDisplayPrice, endingPrice])

  // TODO: connect to loading state
  if (!hasData) {
    return null
  }

  const [tickFormatter, crosshairDateFormatter, ticks] = tickFormat(
    startingPrice.timestamp,
    endingPrice.timestamp,
    timePeriod,
    locale
  )
  const delta = calculateDelta(startingPrice.value, displayPrice.value)
  const formattedDelta = formatDelta(delta)
  const arrow = getDeltaArrow(delta)
  const crosshairEdgeMax = width * 0.85
  const crosshairAtEdge = !!crosshair && crosshair > crosshairEdgeMax

  return (
    <>
      <ChartHeader>
        <TokenPrice>${displayPrice.value.toFixed(2)}</TokenPrice>
        <DeltaContainer>
          {formattedDelta}
          <ArrowCell>{arrow}</ArrowCell>
        </DeltaContainer>
      </ChartHeader>
      <LineChart
        data={pricePoints}
        getX={(p: PricePoint) => timeScale(p.timestamp)}
        getY={(p: PricePoint) => rdScale(p.value)}
        marginTop={margin.top}
        /* Default curve doesn't look good for the ALL chart */
        curve={timePeriod === TimePeriod.ALL ? curveBasis : undefined}
        strokeWidth={2}
        width={graphWidth}
        height={graphHeight}
      >
        {crosshair !== null ? (
          <g>
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
            <text
              x={crosshair + (crosshairAtEdge ? -4 : 4)}
              y={margin.crosshair + 10}
              textAnchor={crosshairAtEdge ? 'end' : 'start'}
              fontSize={12}
              fill={theme.textSecondary}
            >
              {crosshairDateFormatter(displayPrice.timestamp)}
            </text>
            <Line
              from={{ x: crosshair, y: margin.crosshair }}
              to={{ x: crosshair, y: graphHeight }}
              stroke={theme.backgroundOutline}
              strokeWidth={1}
              pointerEvents="none"
              strokeDasharray="4,4"
            />
            <GlyphCircle
              left={crosshair}
              top={rdScale(displayPrice.value) + margin.top}
              size={50}
              fill={theme.accentActive}
              stroke={theme.backgroundOutline}
              strokeWidth={2}
            />
          </g>
        ) : (
          <AxisBottom scale={timeScale} stroke={theme.backgroundOutline} top={graphHeight - 1} hideTicks />
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
          onMouseLeave={resetDisplay}
        />
      </LineChart>
      <TimeOptionsWrapper>
        <TimeOptionsContainer>
          {ORDERED_TIMES.map((time) => (
            <TimeButton key={DISPLAYS[time]} active={timePeriod === time} onClick={() => setTimePeriod(time)}>
              {DISPLAYS[time]}
            </TimeButton>
          ))}
        </TimeOptionsContainer>
      </TimeOptionsWrapper>
    </>
  )
}

export default PriceChart
