import { Trans } from '@lingui/macro'
import { AxisBottom, TickFormatter } from '@visx/axis'
import { localPoint } from '@visx/event'
import { EventType } from '@visx/event/lib/types'
import { GlyphCircle } from '@visx/glyph'
import { Line } from '@visx/shape'
import AnimatedInLineChart from 'components/Charts/AnimatedInLineChart'
import FadedInLineChart from 'components/Charts/FadeInLineChart'
import { bisect, curveCardinal, NumberValue, scaleLinear, timeDay, timeHour, timeMinute, timeMonth } from 'd3'
import { PricePoint } from 'graphql/data/util'
import { TimePeriod } from 'graphql/data/util'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { textFadeIn } from 'theme/styles'
import {
  dayHourFormatter,
  hourFormatter,
  monthDayFormatter,
  monthTickFormatter,
  monthYearDayFormatter,
  weekFormatter,
} from 'utils/formatChartTimes'
import { formatDollar } from 'utils/formatNumbers'

const DATA_EMPTY = { value: 0, timestamp: 0 }

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

function calculateDelta(start: number, current: number) {
  return (current / start - 1) * 100
}

export function getDeltaArrow(delta: number | null | undefined, iconSize = 20) {
  // Null-check not including zero
  if (delta === null || delta === undefined) {
    return null
  } else if (Math.sign(delta) < 0) {
    return <StyledDownArrow size={iconSize} key="arrow-down" aria-label="down" />
  }
  return <StyledUpArrow size={iconSize} key="arrow-up" aria-label="up" />
}

export function formatDelta(delta: number | null | undefined) {
  // Null-check not including zero
  if (delta === null || delta === undefined || delta === Infinity || isNaN(delta)) {
    return '-'
  }
  const formattedDelta = Math.abs(delta).toFixed(2) + '%'
  return formattedDelta
}

export const DeltaText = styled.span<{ delta: number | undefined }>`
  color: ${({ theme, delta }) =>
    delta !== undefined ? (Math.sign(delta) < 0 ? theme.accentFailure : theme.accentSuccess) : theme.textPrimary};
`

const ChartHeader = styled.div`
  position: absolute;
  ${textFadeIn};
  animation-duration: ${({ theme }) => theme.transition.duration.medium};
`
export const TokenPrice = styled.span`
  font-size: 36px;
  line-height: 44px;
`
const MissingPrice = styled(TokenPrice)`
  font-size: 24px;
  line-height: 44px;
  color: ${({ theme }) => theme.textTertiary};
`

const DeltaContainer = styled.div`
  height: 16px;
  display: flex;
  align-items: center;
  margin-top: 4px;
`
export const ArrowCell = styled.div`
  padding-right: 3px;
  display: flex;
`

function fixChart(prices: PricePoint[] | undefined | null) {
  if (!prices) return { prices: null, blanks: [] }

  const fixedChart: PricePoint[] = []
  const blanks: PricePoint[][] = []
  let lastValue: PricePoint | undefined = undefined
  for (let i = 0; i < prices.length; i++) {
    if (prices[i].value !== 0) {
      if (fixedChart.length === 0 && i !== 0) {
        blanks.push([{ ...prices[0], value: prices[i].value }, prices[i]])
      }
      lastValue = prices[i]
      fixedChart.push(prices[i])
    }
  }

  if (lastValue && lastValue !== prices[prices.length - 1]) {
    blanks.push([lastValue, { ...prices[prices.length - 1], value: lastValue.value }])
  }

  return { prices: fixedChart, blanks }
}

const margin = { top: 100, bottom: 48, crosshair: 72 }
const timeOptionsHeight = 44

interface PriceChartProps {
  width: number
  height: number
  prices: PricePoint[] | undefined | null
  timePeriod: TimePeriod
}

export function PriceChart({ width, height, prices: originalPrices, timePeriod }: PriceChartProps) {
  const locale = useActiveLocale()
  const theme = useTheme()

  const { prices, blanks } = useMemo(
    () => (originalPrices && originalPrices.length > 0 ? fixChart(originalPrices) : { prices: null, blanks: [] }),
    [originalPrices]
  )

  const chartAvailable = !!prices && prices.length > 0
  const missingPricesMessage = !chartAvailable ? (
    prices?.length === 0 ? (
      <>
        <Trans>Missing price data due to recently low trading volume on Uniswap v3</Trans>
      </>
    ) : (
      <Trans>Missing chart data</Trans>
    )
  ) : null

  // first price point on the x-axis of the current time period's chart
  const startingPrice = originalPrices?.[0] ?? DATA_EMPTY
  // last price point on the x-axis of the current time period's chart
  const endingPrice = originalPrices?.[originalPrices.length - 1] ?? DATA_EMPTY
  const [displayPrice, setDisplayPrice] = useState(startingPrice)

  // set display price to ending price when prices have changed.
  useEffect(() => {
    setDisplayPrice(endingPrice)
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
        .domain(getPriceBounds(originalPrices ?? []))
        .range([graphInnerHeight, 0]),
    [originalPrices, graphInnerHeight]
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
      <ChartHeader data-cy="chart-header">
        {displayPrice.value ? (
          <>
            <TokenPrice>{formatDollar({ num: displayPrice.value, isPrice: true })}</TokenPrice>
            <DeltaContainer>
              {formattedDelta}
              <ArrowCell>{arrow}</ArrowCell>
            </DeltaContainer>
          </>
        ) : (
          <>
            <MissingPrice>Price Unavailable</MissingPrice>
            <ThemedText.Caption style={{ color: theme.textTertiary }}>{missingPricesMessage}</ThemedText.Caption>
          </>
        )}
      </ChartHeader>
      {!chartAvailable ? (
        <MissingPriceChart width={width} height={graphHeight} message={!!displayPrice.value && missingPricesMessage} />
      ) : (
        <svg data-cy="price-chart" width={width} height={graphHeight} style={{ minWidth: '100%' }}>
          <AnimatedInLineChart
            data={prices}
            getX={getX}
            getY={getY}
            marginTop={margin.top}
            curve={curve}
            strokeWidth={2}
          />
          {blanks.map((blank, index) => (
            <FadedInLineChart
              key={index}
              data={blank}
              getX={getX}
              getY={getY}
              marginTop={margin.top}
              curve={curve}
              strokeWidth={2}
              color={theme.textTertiary}
              dashed
            />
          ))}
          {crosshair !== null ? (
            <g>
              <AxisBottom
                scale={timeScale}
                stroke={theme.backgroundOutline}
                tickFormat={tickFormatter}
                tickStroke={theme.backgroundOutline}
                tickLength={4}
                hideTicks={true}
                tickTransform="translate(0 -5)"
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
            <AxisBottom
              hideAxisLine={true}
              scale={timeScale}
              stroke={theme.backgroundOutline}
              top={graphHeight - 1}
              hideTicks
            />
          )}
          {!width && (
            // Ensures an axis is drawn even if the width is not yet initialized.
            <line
              x1={0}
              y1={graphHeight - 1}
              x2="100%"
              y2={graphHeight - 1}
              fill="transparent"
              shapeRendering="crispEdges"
              stroke={theme.backgroundOutline}
              strokeWidth={1}
            />
          )}
          <rect
            x={0}
            y={0}
            width={width}
            height={graphHeight}
            fill="transparent"
            onTouchStart={handleHover}
            onTouchMove={handleHover}
            onMouseMove={handleHover}
            onMouseLeave={resetDisplay}
          />
        </svg>
      )}
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
function MissingPriceChart({ width, height, message }: { width: number; height: number; message: ReactNode }) {
  const theme = useTheme()
  const midPoint = height / 2 + 45
  return (
    <StyledMissingChart data-cy="missing-chart" width={width} height={height} style={{ minWidth: '100%' }}>
      <path
        d={`M 0 ${midPoint} Q 104 ${midPoint - 70}, 208 ${midPoint} T 416 ${midPoint}
          M 416 ${midPoint} Q 520 ${midPoint - 70}, 624 ${midPoint} T 832 ${midPoint}`}
        stroke={theme.backgroundOutline}
        fill="transparent"
        strokeWidth="2"
      />
      {message && <TrendingUp stroke={theme.textTertiary} x={0} size={12} y={height - chartBottomPadding - 10} />}
      <text y={height - chartBottomPadding} x="20" fill={theme.textTertiary}>
        {message}
      </text>
    </StyledMissingChart>
  )
}
