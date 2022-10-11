import { Trans } from '@lingui/macro'
import { AxisBottom, TickFormatter } from '@visx/axis'
import { localPoint } from '@visx/event'
import { EventType } from '@visx/event/lib/types'
import { GlyphCircle } from '@visx/glyph'
import { Line } from '@visx/shape'
import AnimatedInLineChart from 'components/Charts/AnimatedInLineChart'
import { filterTimeAtom } from 'components/Tokens/state'
import { bisect, curveCardinal, NumberValue, scaleLinear, timeDay, timeHour, timeMinute, timeMonth } from 'd3'
import { PricePoint } from 'graphql/data/Token'
import { TimePeriod } from 'graphql/data/util'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useAtom } from 'jotai'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import {
  dayHourFormatter,
  hourFormatter,
  monthDayFormatter,
  monthTickFormatter,
  monthYearDayFormatter,
  weekFormatter,
} from 'utils/formatChartTimes'
import { formatDollar } from 'utils/formatNumbers'

import { MEDIUM_MEDIA_BREAKPOINT } from '../constants'
import { DISPLAYS, ORDERED_TIMES } from '../TokenTable/TimeSelector'

export const DATA_EMPTY = { value: 0, timestamp: 0 }

export function getPriceBounds(pricePoints: PricePoint[]): [number, number] {
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

export function getDeltaArrow(delta: number | null | undefined) {
  // Null-check not including zero
  if (delta === null || delta === undefined) {
    return null
  } else if (Math.sign(delta) < 0) {
    return <StyledDownArrow size={16} key="arrow-down" />
  }
  return <StyledUpArrow size={16} key="arrow-up" />
}

export function formatDelta(delta: number | null | undefined) {
  // Null-check not including zero
  if (delta === null || delta === undefined) {
    return '-'
  }
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
  margin-top: 4px;
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

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    width: 100%;
    justify-content: space-between;
    border: none;
  }
`
const TimeButton = styled.button<{ active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.backgroundInteractive : 'transparent')};
  font-weight: 600;
  font-size: 16px;
  padding: 6px 12px;
  border-radius: 12px;
  line-height: 20px;
  border: none;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.textPrimary : theme.textSecondary)};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  :hover {
    ${({ active, theme }) => !active && `opacity: ${theme.opacity.hover};`}
  }
`

const margin = { top: 100, bottom: 48, crosshair: 72 }
const timeOptionsHeight = 44

interface PriceChartProps {
  width: number
  height: number
  prices: PricePoint[] | undefined
}

export function PriceChart({ width, height, prices }: PriceChartProps) {
  const [timePeriod, setTimePeriod] = useAtom(filterTimeAtom)
  const locale = useActiveLocale()
  const theme = useTheme()

  // first price point on the x-axis of the current time period's chart
  const startingPrice = prices?.[0] ?? DATA_EMPTY
  // last price point on the x-axis of the current time period's chart
  const endingPrice = prices?.[prices.length - 1] ?? DATA_EMPTY
  const [displayPrice, setDisplayPrice] = useState(startingPrice)

  // set display price to ending price when prices have changed.
  useEffect(() => {
    if (prices) {
      setDisplayPrice(endingPrice)
    }
  }, [prices, endingPrice])
  const [crosshair, setCrosshair] = useState<number | null>(null)

  const graphHeight = height - timeOptionsHeight > 0 ? height - timeOptionsHeight : 0
  const graphInnerHeight = graphHeight - margin.top - margin.bottom > 0 ? graphHeight - margin.top - margin.bottom : 0

  // Defining scales
  // x scale
  const timeScale = useMemo(
    () => scaleLinear().domain([startingPrice.timestamp, endingPrice.timestamp]).range([0, width]),
    [startingPrice, endingPrice, width]
  )
  // y scale
  const rdScale = useMemo(
    () =>
      scaleLinear()
        .domain(getPriceBounds(prices ?? []))
        .range([graphInnerHeight, 0]),
    [prices, graphInnerHeight]
  )

  function tickFormat(
    timePeriod: TimePeriod,
    locale: string
  ): [TickFormatter<NumberValue>, (v: number) => string, NumberValue[]] {
    const offsetTime = (endingPrice.timestamp.valueOf() - startingPrice.timestamp.valueOf()) / 24
    const startDateWithOffset = new Date((startingPrice.timestamp.valueOf() + offsetTime) * 1000)
    const endDateWithOffset = new Date((endingPrice.timestamp.valueOf() - offsetTime) * 1000)
    switch (timePeriod) {
      case TimePeriod.HOUR:
        return [
          hourFormatter(locale),
          dayHourFormatter(locale),
          (timeMinute.every(5) ?? timeMinute)
            .range(startDateWithOffset, endDateWithOffset, 2)
            .map((x) => x.valueOf() / 1000),
        ]
      case TimePeriod.DAY:
        return [
          hourFormatter(locale),
          dayHourFormatter(locale),
          timeHour.range(startDateWithOffset, endDateWithOffset, 4).map((x) => x.valueOf() / 1000),
        ]
      case TimePeriod.WEEK:
        return [
          weekFormatter(locale),
          dayHourFormatter(locale),
          timeDay.range(startDateWithOffset, endDateWithOffset, 1).map((x) => x.valueOf() / 1000),
        ]
      case TimePeriod.MONTH:
        return [
          monthDayFormatter(locale),
          dayHourFormatter(locale),
          timeDay.range(startDateWithOffset, endDateWithOffset, 7).map((x) => x.valueOf() / 1000),
        ]
      case TimePeriod.YEAR:
        return [
          monthTickFormatter(locale),
          monthYearDayFormatter(locale),
          timeMonth.range(startDateWithOffset, endDateWithOffset, 2).map((x) => x.valueOf() / 1000),
        ]
    }
  }

  const handleHover = useCallback(
    (event: Element | EventType) => {
      if (!prices) return

      const { x } = localPoint(event) || { x: 0 }
      const x0 = timeScale.invert(x) // get timestamp from the scalexw
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
        setDisplayPrice(pricePoint)
      }
    },
    [timeScale, prices]
  )

  const resetDisplay = useCallback(() => {
    setCrosshair(null)
    setDisplayPrice(endingPrice)
  }, [setCrosshair, setDisplayPrice, endingPrice])

  const [tickFormatter, crosshairDateFormatter, ticks] = tickFormat(timePeriod, locale)
  const delta = calculateDelta(startingPrice.value, displayPrice.value)
  const formattedDelta = formatDelta(delta)
  const arrow = getDeltaArrow(delta)
  const crosshairEdgeMax = width * 0.85
  const crosshairAtEdge = !!crosshair && crosshair > crosshairEdgeMax
  const hasData = prices && prices.length > 0

  /*
   * Default curve doesn't look good for the HOUR chart.
   * Higher values make the curve more rigid, lower values smooth the curve but make it less "sticky" to real data points,
   * making it unacceptable for shorter durations / smaller variances.
   */
  const curveTension = timePeriod === TimePeriod.HOUR ? 1 : 0.9

  const getX = useMemo(() => (p: PricePoint) => timeScale(p.timestamp), [timeScale])
  const getY = useMemo(() => (p: PricePoint) => rdScale(p.value), [rdScale])
  const curve = useMemo(() => curveCardinal.tension(curveTension), [curveTension])
  return (
    <>
      <ChartHeader>
        <TokenPrice>{formatDollar({ num: displayPrice.value, isPrice: true })}</TokenPrice>
        <DeltaContainer>
          {formattedDelta}
          <ArrowCell>{arrow}</ArrowCell>
        </DeltaContainer>
      </ChartHeader>
      {!hasData ? (
        <MissingPriceChart
          width={width}
          height={graphHeight}
          message={prices && prices.length === 0 ? <NoV3DataMessage /> : <MissingDataMessage />}
        />
      ) : (
        <svg width={width} height={graphHeight}>
          <AnimatedInLineChart
            data={prices}
            getX={getX}
            getY={getY}
            marginTop={margin.top}
            curve={curve}
            strokeWidth={2}
          />
          {crosshair !== null ? (
            <g>
              <AxisBottom
                scale={timeScale}
                stroke={theme.backgroundOutline}
                tickFormat={tickFormatter}
                tickStroke={theme.backgroundOutline}
                tickLength={4}
                hideTicks={true}
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
                fill={theme.accentAction}
                stroke={theme.backgroundOutline}
                strokeWidth={0.5}
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
        </svg>
      )}
      <TimeOptionsWrapper>
        <TimeOptionsContainer>
          {ORDERED_TIMES.map((time) => (
            <TimeButton
              key={DISPLAYS[time]}
              active={timePeriod === time}
              onClick={() => {
                setTimePeriod(time)
              }}
            >
              {DISPLAYS[time]}
            </TimeButton>
          ))}
        </TimeOptionsContainer>
      </TimeOptionsWrapper>
    </>
  )
}

const StyledMissingChart = styled.svg`
  text {
    font-size: 12px;
    font-weight: 400;
  }
`

const chartBottomPadding = 15

const NoV3DataMessage = () => (
  <Trans>This token doesn&apos;t have chart data because it hasn&apos;t been traded on Uniswap v3</Trans>
)
const MissingDataMessage = () => <Trans>Missing chart data</Trans>

function MissingPriceChart({ width, height, message }: { width: number; height: number; message: ReactNode }) {
  const theme = useTheme()
  const midPoint = height / 2 + 45
  return (
    <StyledMissingChart width={width} height={height}>
      <path
        d={`M 0 ${midPoint} Q 104 ${midPoint - 70}, 208 ${midPoint} T 416 ${midPoint}
          M 416 ${midPoint} Q 520 ${midPoint - 70}, 624 ${midPoint} T 832 ${midPoint}`}
        stroke={theme.backgroundOutline}
        fill="transparent"
        strokeWidth="2"
      />
      <TrendingUp stroke={theme.textTertiary} x={0} size={12} y={height - chartBottomPadding - 10} />
      <text y={height - chartBottomPadding} x="20" fill={theme.textTertiary}>
        {message || <Trans>Missing chart data</Trans>}
      </text>
      <path
        d={`M 0 ${height - 1}, ${width} ${height - 1}`}
        stroke={theme.backgroundOutline}
        fill="transparent"
        strokeWidth="1"
      />
    </StyledMissingChart>
  )
}

export default PriceChart
