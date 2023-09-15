import { Trans } from '@lingui/macro'
import { AxisBottom } from '@visx/axis'
import { localPoint } from '@visx/event'
import { EventType } from '@visx/event/lib/types'
import { GlyphCircle } from '@visx/glyph'
import { Line } from '@visx/shape'
import AnimatedInLineChart from 'components/Charts/AnimatedInLineChart'
import FadedInLineChart from 'components/Charts/FadeInLineChart'
import { getTimestampFormatter, TimestampFormatterType } from 'components/Charts/PriceChart/format'
import { cleanPricePoints, getNearestPricePoint, getPriceBounds, getTicks } from 'components/Charts/PriceChart/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { curveCardinal, scaleLinear } from 'd3'
import { PricePoint, TimePeriod } from 'graphql/data/util'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Info, TrendingUp } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme'
import { textFadeIn } from 'theme/styles'
import { useFormatter } from 'utils/formatNumbers'

import { calculateDelta, DeltaArrow, formatDelta } from './Delta'

const DATA_EMPTY = { value: 0, timestamp: 0 }

const ChartHeader = styled.div`
  position: absolute;
  ${textFadeIn};
  animation-duration: ${({ theme }) => theme.transition.duration.medium};
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

const OutdatedContainer = styled.div`
  color: ${({ theme }) => theme.neutral2};
`

const DeltaContainer = styled.div`
  height: 16px;
  display: flex;
  align-items: center;
  margin-top: 4px;
  color: ${({ theme }) => theme.neutral2};
`

const OutdatedPriceContainer = styled.div`
  display: flex;
  gap: 6px;
  font-size: 24px;
  line-height: 44px;
`

const margin = { top: 100, bottom: 48, crosshair: 72 }
const timeOptionsHeight = 44

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
      <DeltaArrow delta={delta} noColor={noColor} />
    </DeltaContainer>
  )
}

interface PriceChartProps {
  width: number
  height: number
  prices?: PricePoint[] | null
  timePeriod: TimePeriod
}

export function PriceChart({ width, height, prices: originalPrices, timePeriod }: PriceChartProps) {
  const locale = useActiveLocale()
  const theme = useTheme()
  const { formatFiatPrice } = useFormatter()

  const { prices, blanks } = useMemo(
    () =>
      originalPrices && originalPrices.length > 0 ? cleanPricePoints(originalPrices) : { prices: null, blanks: [] },
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

  const tooltipMessage = (
    <>
      <Trans>This price may not be up-to-date due to low trading volume.</Trans>
    </>
  )

  //get the last non-zero price point
  const lastPrice = useMemo(() => {
    if (!prices) return DATA_EMPTY
    for (let i = prices.length - 1; i >= 0; i--) {
      if (prices[i].value !== 0) return prices[i]
    }
    return DATA_EMPTY
  }, [prices])

  //get the first non-zero price point
  const firstPrice = useMemo(() => {
    if (!prices) return DATA_EMPTY
    for (let i = 0; i < prices.length; i++) {
      if (prices[i].value !== 0) return prices[i]
    }
    return DATA_EMPTY
  }, [prices])

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
  const rdScale = useMemo(() => {
    const { min, max } = getPriceBounds(originalPrices ?? [])
    return scaleLinear().domain([min, max]).range([graphInnerHeight, 0])
  }, [originalPrices, graphInnerHeight])

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
    [timeScale, prices]
  )

  const resetDisplay = useCallback(() => {
    setCrosshair(null)
    setDisplayPrice(endingPrice)
  }, [setCrosshair, setDisplayPrice, endingPrice])

  // Resets the crosshair when the time period is changed, to avoid stale UI
  useEffect(() => {
    setCrosshair(null)
  }, [timePeriod])

  const { tickTimestampFormatter, crosshairTimestampFormatter, ticks } = useMemo(() => {
    // max ticks based on screen size
    const maxTicks = Math.floor(width / 100)
    const tickTimestampFormatter = getTimestampFormatter(timePeriod, locale, TimestampFormatterType.TICK)
    const crosshairTimestampFormatter = getTimestampFormatter(timePeriod, locale, TimestampFormatterType.CROSSHAIR)
    const ticks = getTicks(startingPrice.timestamp, endingPrice.timestamp, timePeriod, maxTicks)

    return { tickTimestampFormatter, crosshairTimestampFormatter, ticks }
  }, [endingPrice.timestamp, locale, startingPrice.timestamp, timePeriod, width])

  const crosshairEdgeMax = width * 0.85
  const crosshairAtEdge = !!crosshair && crosshair > crosshairEdgeMax

  // Default curve doesn't look good for the HOUR chart.
  // Higher values make the curve more rigid, lower values smooth the curve but make it less "sticky" to real data points,
  // making it unacceptable for shorter durations / smaller variances.
  const curveTension = timePeriod === TimePeriod.HOUR ? 1 : 0.9

  const getX = useMemo(() => (p: PricePoint) => timeScale(p.timestamp), [timeScale])
  const getY = useMemo(() => (p: PricePoint) => rdScale(p.value), [rdScale])
  const curve = useMemo(() => curveCardinal.tension(curveTension), [curveTension])

  return (
    <>
      <ChartHeader data-cy="chart-header">
        {displayPrice.value ? (
          <>
            <TokenPrice>{formatFiatPrice({ price: displayPrice.value })}</TokenPrice>
            <ChartDelta startingPrice={startingPrice} endingPrice={displayPrice} />
          </>
        ) : lastPrice.value ? (
          <OutdatedContainer>
            <OutdatedPriceContainer>
              <TokenPrice>{formatFiatPrice({ price: lastPrice.value })}</TokenPrice>
              <MouseoverTooltip text={tooltipMessage}>
                <Info size={16} />
              </MouseoverTooltip>
            </OutdatedPriceContainer>
            <ChartDelta startingPrice={firstPrice} endingPrice={lastPrice} noColor />
          </OutdatedContainer>
        ) : (
          <>
            <MissingPrice>Price Unavailable</MissingPrice>
            <ThemedText.BodySmall style={{ color: theme.neutral3 }}>{missingPricesMessage}</ThemedText.BodySmall>
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
              color={theme.neutral3}
              dashed
            />
          ))}
          {crosshair !== null ? (
            <g>
              <AxisBottom
                top={graphHeight - 1}
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
                y={margin.crosshair + 10}
                textAnchor={crosshairAtEdge ? 'end' : 'start'}
                fontSize={12}
                fill={theme.neutral2}
              >
                {crosshairTimestampFormatter(displayPrice.timestamp)}
              </text>
              <Line
                from={{ x: crosshair, y: margin.crosshair }}
                to={{ x: crosshair, y: graphHeight }}
                stroke={theme.surface3}
                strokeWidth={1}
                pointerEvents="none"
                strokeDasharray="4,4"
              />
              <GlyphCircle
                left={crosshair}
                top={rdScale(displayPrice.value) + margin.top}
                size={50}
                fill={theme.accent1}
                stroke={theme.surface3}
                strokeWidth={0.5}
              />
            </g>
          ) : (
            <AxisBottom hideAxisLine={true} scale={timeScale} stroke={theme.surface3} top={graphHeight - 1} hideTicks />
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
              stroke={theme.surface3}
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
    font-weight: 485;
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
        stroke={theme.surface3}
        fill="transparent"
        strokeWidth="2"
      />
      {message && <TrendingUp stroke={theme.neutral3} x={0} size={12} y={height - chartBottomPadding - 10} />}
      <text y={height - chartBottomPadding} x="20" fill={theme.neutral3}>
        {message}
      </text>
    </StyledMissingChart>
  )
}
