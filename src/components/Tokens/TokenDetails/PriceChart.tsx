import { Trans } from '@lingui/macro'
import { AxisBottom } from '@visx/axis'
import { localPoint } from '@visx/event'
import { EventType } from '@visx/event/lib/types'
import { GlyphCircle } from '@visx/glyph'
import { Line } from '@visx/shape'
import AnimatedInLineChart from 'components/Charts/AnimatedInLineChart'
import FadedInLineChart from 'components/Charts/FadeInLineChart'
import { getTimestampFormatter, TimestampFormatterType } from 'components/Charts/PriceChart/format'
import { cleanUpPricePoints, getNearestPricePoint, getPriceBounds, getTicks } from 'components/Charts/PriceChart/util'
import { ArrowChangeDown } from 'components/Icons/ArrowChangeDown'
import { ArrowChangeUp } from 'components/Icons/ArrowChangeUp'
import { MouseoverTooltip } from 'components/Tooltip'
import { curveCardinal, NumberValue, ScaleLinear, scaleLinear } from 'd3'
import { PricePoint, TimePeriod } from 'graphql/data/util'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Info } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme'
import { textFadeIn } from 'theme/styles'
import { formatUSDPrice } from 'utils/formatNumbers'

const DATA_EMPTY = { value: 0, timestamp: 0 }

const StyledUpArrow = styled(ArrowChangeUp)<{ noColor?: boolean }>`
  color: ${({ theme, noColor }) => (noColor ? theme.neutral2 : theme.success)};
`
const StyledDownArrow = styled(ArrowChangeDown)<{ noColor?: boolean }>`
  color: ${({ theme, noColor }) => (noColor ? theme.neutral2 : theme.critical)};
`

function calculateDelta(start: number, current: number) {
  return (current / start - 1) * 100
}

function isValidDelta(delta: number | null | undefined): delta is number {
  // Null-check not including zero
  return delta !== null && delta !== undefined && delta !== Infinity && !isNaN(delta)
}

interface DeltaArrowProps {
  delta?: number | null
  noColor?: boolean
  size?: number
}
export function DeltaArrow({ delta, noColor = false, size = 16 }: DeltaArrowProps) {
  if (!isValidDelta(delta)) return null

  return Math.sign(delta) < 0 ? (
    <StyledDownArrow width={size} height={size} key="arrow-down" aria-label="down" noColor={noColor} />
  ) : (
    <StyledUpArrow width={size} height={size} key="arrow-up" aria-label="up" noColor={noColor} />
  )
}

export function formatDelta(delta: number | null | undefined) {
  if (!isValidDelta(delta)) return '-'

  const formattedDelta = Math.abs(delta).toFixed(2) + '%'
  return formattedDelta
}

export const DeltaText = styled.span<{ delta?: number }>`
  color: ${({ theme, delta }) =>
    delta !== undefined ? (Math.sign(delta) < 0 ? theme.critical : theme.success) : theme.neutral1};
`
const ChartHeaderWrapper = styled.div<{ priceOutdated?: boolean }>`
  position: absolute;
  ${textFadeIn};
  animation-duration: ${({ theme }) => theme.transition.duration.medium};
  ${({ theme, priceOutdated }) => priceOutdated && `color: ${theme.neutral2}`};
`
export const TokenPrice = styled.span`
  font-size: 36px;
  line-height: 44px;
  font-weight: 485;
`
const MissingPrice = styled(TokenPrice)`
  font-size: 24px;
  line-height: 44px;
  color: ${({ theme }) => theme.neutral3};
`
const DeltaContainer = styled.div`
  height: 16px;
  display: flex;
  align-items: center;
  margin-top: 4px;
  color: ${({ theme }) => theme.neutral2};
`
export const ArrowCell = styled.div`
  padding-right: 3px;
  display: flex;
`
const PriceContainer = styled.div`
  display: flex;
  gap: 6px;
  font-size: 24px;
  line-height: 44px;
`

enum ChartErrorType {
  NO_DATA_AVAILABLE,
  NO_RECENT_VOLUME,
}

const CHART_ERROR_MESSAGES: Record<ChartErrorType, ReactNode> = {
  [ChartErrorType.NO_DATA_AVAILABLE]: <Trans>Missing chart data</Trans>,
  [ChartErrorType.NO_RECENT_VOLUME]: <Trans>Missing price data due to recently low trading volume on Uniswap v3</Trans>,
}

type ChartUnavailable = { chartAvailable: false; errorType: ChartErrorType }

type ChartUtils = {
  chartAvailable: true
  prices: PricePoint[]
  startingPrice: PricePoint
  endingPrice: PricePoint
  blanks: PricePoint[][]
  timeScale: ScaleLinear<number, number>
  priceScale: ScaleLinear<number, number>
  ticks: NumberValue[]
  tickTimestampFormatter: (n: NumberValue) => string
  crosshairTimestampFormatter: (n: NumberValue) => string
}

function getChartUtils({
  width,
  height,
  prices,
  timePeriod,
  locale,
}: PriceChartProps & { locale: string }): ChartUtils | ChartUnavailable {
  if (!prices) return { chartAvailable: false, errorType: ChartErrorType.NO_DATA_AVAILABLE }

  const { prices: fixedPrices, blanks } = cleanUpPricePoints(prices)
  if (fixedPrices.length < 2) return { chartAvailable: false, errorType: ChartErrorType.NO_RECENT_VOLUME }

  const startingPrice = prices[0]
  const endingPrice = prices[prices.length - 1]

  // x-axis scale
  const timeScale = scaleLinear().domain([startingPrice.timestamp, endingPrice.timestamp]).range([0, width])

  const { min, max } = getPriceBounds(prices)
  // y-axis scale
  const priceScale = scaleLinear().domain([min, max]).range([height, 0])

  // Limits the number of ticks based on graph width
  const maxTicks = Math.floor(width / 100)

  const ticks = getTicks(startingPrice.timestamp, endingPrice.timestamp, timePeriod, maxTicks)
  const tickTimestampFormatter = getTimestampFormatter(timePeriod, locale, TimestampFormatterType.TICK)
  const crosshairTimestampFormatter = getTimestampFormatter(timePeriod, locale, TimestampFormatterType.CROSSHAIR)

  return {
    prices: fixedPrices,
    startingPrice,
    endingPrice,
    blanks,
    chartAvailable: true,
    timeScale,
    priceScale,
    ticks,
    tickTimestampFormatter,
    crosshairTimestampFormatter,
  }
}

interface ChartDeltaProps {
  startingPrice: PricePoint
  endingPrice: PricePoint
  noColor?: boolean
}
function ChartDelta({ startingPrice, endingPrice, noColor }: ChartDeltaProps) {
  const delta = calculateDelta(startingPrice.value, endingPrice.value)
  return (
    <DeltaContainer>
      {formatDelta(delta)}
      <ArrowCell>
        <DeltaArrow delta={delta} noColor={noColor} />
      </ArrowCell>
    </DeltaContainer>
  )
}

function ChartHeader({ displayPrice, chartUtils }: { displayPrice: PricePoint; chartUtils: ChartUtils }) {
  const { prices } = chartUtils

  const lastPrice = useMemo(() => {
    for (let i = prices.length - 1; i >= 0; i--) if (prices[i].value !== 0) return prices[i]
    return DATA_EMPTY
  }, [prices])

  const priceOutdated = !displayPrice.value
  const headerPrice = formatUSDPrice(priceOutdated ? lastPrice.value : displayPrice.value)
  const deltaEnd = priceOutdated ? lastPrice : displayPrice

  return (
    <ChartHeaderWrapper data-cy="chart-header" priceOutdated={priceOutdated}>
      <PriceContainer>
        <TokenPrice>{headerPrice}</TokenPrice>
        {priceOutdated && (
          <MouseoverTooltip text={<Trans>This price may not be up-to-date due to low trading volume.</Trans>}>
            <Info size={16} />
          </MouseoverTooltip>
        )}
      </PriceContainer>
      <ChartDelta startingPrice={prices[0]} endingPrice={deltaEnd} noColor={priceOutdated} />
    </ChartHeaderWrapper>
  )
}

const CHART_MARGIN = { top: 100, bottom: 48, crosshair: 72 }

interface PriceChartProps {
  width: number
  height: number
  prices?: PricePoint[] | null
  timePeriod: TimePeriod
}

function ChartBody(props: PriceChartProps & { chartUtils: ChartUtils }) {
  const { chartUtils, width, height, timePeriod } = props
  const {
    prices,
    endingPrice,
    blanks,
    timeScale,
    priceScale,
    ticks,
    tickTimestampFormatter,
    crosshairTimestampFormatter,
  } = chartUtils

  const theme = useTheme()

  const [displayPrice, setDisplayPrice] = useState(endingPrice)
  const [crosshair, setCrosshair] = useState<number | null>(null)

  const handleHover = useCallback(
    (event: Element | EventType) => {
      if (!prices) return

      const { x } = localPoint(event) || { x: 0 }
      const pricePoint = getNearestPricePoint(x, prices, timeScale)

      if (pricePoint) {
        setCrosshair(timeScale(pricePoint.timestamp))
        setDisplayPrice(pricePoint)
      }
    },
    [prices, timeScale]
  )

  const resetDisplay = useCallback(() => {
    setCrosshair(null)
    setDisplayPrice(endingPrice)
  }, [setCrosshair, setDisplayPrice, endingPrice])

  // Resets the crosshair when the time period is changed, to avoid stale UI
  useEffect(() => {
    setCrosshair(null)
  }, [timePeriod])

  const crosshairEdgeMax = width * 0.85
  const crosshairAtEdge = !!crosshair && crosshair > crosshairEdgeMax

  // Default curve doesn't look good for the HOUR chart.
  // Higher values make the curve more rigid, lower values smooth the curve but make it less "sticky" to real data points,
  // making it unacceptable for shorter durations / smaller variances.
  const curveTension = timePeriod === TimePeriod.HOUR ? 1 : 0.9

  const getX = useMemo(() => (p: PricePoint) => timeScale(p.timestamp), [timeScale])
  const getY = useMemo(() => (p: PricePoint) => priceScale(p.value), [priceScale])
  const curve = useMemo(() => curveCardinal.tension(curveTension), [curveTension])

  return (
    <>
      <ChartHeader chartUtils={chartUtils} displayPrice={displayPrice} />

      <svg data-cy="price-chart" width={width} height={height} style={{ minWidth: '100%' }}>
        <AnimatedInLineChart
          data={prices}
          getX={getX}
          getY={getY}
          marginTop={CHART_MARGIN.top}
          curve={curve}
          strokeWidth={2}
        />
        {blanks.map((blank, index) => (
          <FadedInLineChart
            key={index}
            data={blank}
            getX={getX}
            getY={getY}
            marginTop={CHART_MARGIN.top}
            curve={curve}
            strokeWidth={2}
            color={theme.neutral3}
            dashed
          />
        ))}
        {crosshair !== null ? (
          <g>
            {/* todo(now) remove unneeded props */}
            <AxisBottom
              top={height - 1}
              scale={timeScale}
              stroke={theme.surface3}
              hideTicks={true}
              tickValues={ticks}
              tickFormat={tickTimestampFormatter}
              tickLabelProps={() => ({
                fill: theme.neutral2,
                fontSize: 12,
                textAnchor: 'middle',
                transform: 'translate(0 -29)',
              })}
            />
            <text
              x={crosshair + (crosshairAtEdge ? -4 : 4)}
              y={CHART_MARGIN.crosshair + 10}
              textAnchor={crosshairAtEdge ? 'end' : 'start'}
              fontSize={12}
              fill={theme.neutral2}
            >
              {crosshairTimestampFormatter(displayPrice.timestamp)}
            </text>
            <Line
              from={{ x: crosshair, y: CHART_MARGIN.crosshair }}
              to={{ x: crosshair, y: height }}
              stroke={theme.surface3}
              strokeWidth={1}
              pointerEvents="none"
              strokeDasharray="4,4"
            />
            <GlyphCircle
              left={crosshair}
              top={priceScale(displayPrice.value) + CHART_MARGIN.top}
              size={50}
              fill={theme.accent1}
              stroke={theme.surface3}
              strokeWidth={0.5}
            />
          </g>
        ) : (
          <AxisBottom hideAxisLine={true} scale={timeScale} stroke={theme.surface3} top={height - 1} hideTicks />
        )}
        {!width && (
          // Ensures an axis is drawn even if the width is not yet initialized.
          <line
            x1={0}
            y1={height - 1}
            x2="100%"
            y2={height - 1}
            fill="transparent"
            shapeRendering="crispEdges"
            stroke={theme.surface3}
            strokeWidth={1}
          />
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
    </>
  )
}

export function PriceChart(props: PriceChartProps) {
  const locale = useActiveLocale()
  const graphInnerHeight =
    props.height - CHART_MARGIN.top - CHART_MARGIN.bottom > 0
      ? props.height - CHART_MARGIN.top - CHART_MARGIN.bottom
      : 0

  const chartUtils = useMemo(
    () => getChartUtils({ ...props, locale, height: graphInnerHeight }),
    [props, locale, graphInnerHeight]
  )

  if (!chartUtils.chartAvailable) {
    return (
      <MissingPriceChart
        width={props.width}
        height={props.height}
        message={CHART_ERROR_MESSAGES[chartUtils.errorType]}
      />
    )
  }

  return <ChartBody {...props} chartUtils={chartUtils} />
}

function MissingPriceChart({ width, height, message }: { width: number; height: number; message: ReactNode }) {
  const theme = useTheme()
  const midPoint = height / 2 + 45
  return (
    <>
      <ChartHeaderWrapper data-cy="chart-header">
        <MissingPrice>Price Unavailable</MissingPrice>
        <ThemedText.BodySmall style={{ color: theme.neutral3 }}>{message}</ThemedText.BodySmall>
      </ChartHeaderWrapper>
      <svg data-cy="missing-chart" width={width} height={height} style={{ minWidth: '100%' }}>
        <path
          d={`M 0 ${midPoint} Q 104 ${midPoint - 70}, 208 ${midPoint} T 416 ${midPoint}
          M 416 ${midPoint} Q 520 ${midPoint - 70}, 624 ${midPoint} T 832 ${midPoint}`}
          stroke={theme.surface3}
          fill="transparent"
          strokeWidth="2"
        />
      </svg>
    </>
  )
}
