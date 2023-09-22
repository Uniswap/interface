import { Trans } from '@lingui/macro'
import { AxisBottom } from '@visx/axis'
import { localPoint } from '@visx/event'
import { EventType } from '@visx/event/lib/types'
import { GlyphCircle } from '@visx/glyph'
import { Line } from '@visx/shape'
import AnimatedInLineChart from 'components/Charts/AnimatedInLineChart'
import FadedInLineChart from 'components/Charts/FadeInLineChart'
import { buildChartModel, ChartErrorType, ChartModel, ErroredChartModel } from 'components/Charts/PriceChart/ChartModel'
import { getTimestampFormatter, TimestampFormatterType } from 'components/Charts/PriceChart/format'
import { getNearestPricePoint, getTicks } from 'components/Charts/PriceChart/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { curveCardinal } from 'd3'
import { PricePoint, TimePeriod } from 'graphql/data/util'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Info } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { useFormatter } from 'utils/formatNumbers'

import { calculateDelta, DeltaArrow, formatDelta } from '../../Tokens/TokenDetails/Delta'

const CHART_MARGIN = { top: 100, bottom: 48, crosshair: 72 }

const ChartHeaderWrapper = styled.div<{ stale?: boolean }>`
  position: absolute;
  ${textFadeIn};
  animation-duration: ${({ theme }) => theme.transition.duration.medium};
  ${({ theme, stale }) => stale && `color: ${theme.neutral2}`};
`
const PriceContainer = styled.div`
  display: flex;
  gap: 6px;
  font-size: 24px;
  line-height: 44px;
`
const DeltaContainer = styled.div`
  height: 16px;
  display: flex;
  align-items: center;
  margin-top: 4px;
  color: ${({ theme }) => theme.neutral2};
`

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

interface ChartHeaderProps {
  crosshairPrice?: PricePoint
  chart: ChartModel
}

function ChartHeader({ crosshairPrice, chart }: ChartHeaderProps) {
  const { formatFiatPrice } = useFormatter()

  const { startingPrice, endingPrice, lastValidPrice } = chart

  const priceOutdated = lastValidPrice !== endingPrice
  const displayPrice = crosshairPrice ?? (priceOutdated ? lastValidPrice : endingPrice)

  const displayIsStale = priceOutdated && !crosshairPrice
  return (
    <ChartHeaderWrapper data-cy="chart-header" stale={displayIsStale}>
      <PriceContainer>
        <ThemedText.HeadlineLarge color="inherit">
          {formatFiatPrice({ price: displayPrice.value })}
        </ThemedText.HeadlineLarge>
        {displayIsStale && (
          <MouseoverTooltip text={<Trans>This price may not be up-to-date due to low trading volume.</Trans>}>
            <Info size={16} data-testid="chart-stale-icon" />
          </MouseoverTooltip>
        )}
      </PriceContainer>
      <ChartDelta startingPrice={startingPrice} endingPrice={displayPrice} noColor={priceOutdated} />
    </ChartHeaderWrapper>
  )
}

function ChartBody({ chart, timePeriod }: { chart: ChartModel; timePeriod: TimePeriod }) {
  const locale = useActiveLocale()

  const { prices, blanks, timeScale, priceScale, dimensions } = chart

  const { ticks, tickTimestampFormatter, crosshairTimestampFormatter } = useMemo(() => {
    // Limits the number of ticks based on graph width
    const maxTicks = Math.floor(dimensions.width / 100)

    const ticks = getTicks(chart.startingPrice.timestamp, chart.endingPrice.timestamp, timePeriod, maxTicks)
    const tickTimestampFormatter = getTimestampFormatter(timePeriod, locale, TimestampFormatterType.TICK)
    const crosshairTimestampFormatter = getTimestampFormatter(timePeriod, locale, TimestampFormatterType.CROSSHAIR)

    return { ticks, tickTimestampFormatter, crosshairTimestampFormatter }
  }, [dimensions.width, chart.startingPrice.timestamp, chart.endingPrice.timestamp, timePeriod, locale])

  const theme = useTheme()
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; price: PricePoint }>()
  const resetCrosshair = useCallback(() => setCrosshair(undefined), [setCrosshair])

  const setCrosshairOnHover = useCallback(
    (event: Element | EventType) => {
      const { x } = localPoint(event) || { x: 0 }
      const price = getNearestPricePoint(x, prices, timeScale)

      if (price) {
        const x = timeScale(price.timestamp)
        const y = priceScale(price.value)
        setCrosshair({ x, y, price })
      }
    },
    [priceScale, timeScale, prices]
  )

  // Resets the crosshair when the time period is changed, to avoid stale UI
  useEffect(() => resetCrosshair(), [resetCrosshair, timePeriod])

  const crosshairEdgeMax = dimensions.width * 0.85
  const crosshairAtEdge = !!crosshair && crosshair.x > crosshairEdgeMax

  // Default curve doesn't look good for the HOUR chart.
  // Higher values make the curve more rigid, lower values smooth the curve but make it less "sticky" to real data points,
  // making it unacceptable for shorter durations / smaller variances.
  const curveTension = timePeriod === TimePeriod.HOUR ? 1 : 0.9

  const getX = useCallback((p: PricePoint) => timeScale(p.timestamp), [timeScale])
  const getY = useCallback((p: PricePoint) => priceScale(p.value), [priceScale])
  const curve = useMemo(() => curveCardinal.tension(curveTension), [curveTension])

  return (
    <>
      <ChartHeader chart={chart} crosshairPrice={crosshair?.price} />
      <svg data-cy="price-chart" width={dimensions.width} height={dimensions.height} style={{ minWidth: '100%' }}>
        <AnimatedInLineChart
          data={prices}
          getX={getX}
          getY={getY}
          marginTop={dimensions.marginTop}
          curve={curve}
          strokeWidth={2}
        />
        {blanks.map((blank, index) => (
          <FadedInLineChart
            key={index}
            data={blank}
            getX={getX}
            getY={getY}
            marginTop={dimensions.marginTop}
            curve={curve}
            strokeWidth={2}
            color={theme.neutral3}
            dashed
          />
        ))}
        {crosshair !== undefined ? (
          <g>
            <AxisBottom
              top={dimensions.height - 1}
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
              x={crosshair.x + (crosshairAtEdge ? -4 : 4)}
              y={CHART_MARGIN.crosshair + 10}
              textAnchor={crosshairAtEdge ? 'end' : 'start'}
              fontSize={12}
              fill={theme.neutral2}
            >
              {crosshairTimestampFormatter(crosshair.price.timestamp)}
            </text>
            <Line
              from={{ x: crosshair.x, y: CHART_MARGIN.crosshair }}
              to={{ x: crosshair.x, y: dimensions.height }}
              stroke={theme.surface3}
              strokeWidth={1}
              pointerEvents="none"
              strokeDasharray="4,4"
            />
            <GlyphCircle
              left={crosshair.x}
              top={crosshair.y + dimensions.marginTop}
              size={50}
              fill={theme.accent1}
              stroke={theme.surface3}
              strokeWidth={0.5}
            />
          </g>
        ) : (
          <AxisBottom
            hideAxisLine={true}
            scale={timeScale}
            stroke={theme.surface3}
            top={dimensions.height - 1}
            hideTicks
          />
        )}
        {!dimensions.width && (
          // Ensures an axis is drawn even if the width is not yet initialized.
          <line
            x1={0}
            y1={dimensions.height - 1}
            x2="100%"
            y2={dimensions.height - 1}
            fill="transparent"
            shapeRendering="crispEdges"
            stroke={theme.surface3}
            strokeWidth={1}
          />
        )}
        <rect
          x={0}
          y={0}
          width={dimensions.width}
          height={dimensions.height}
          fill="transparent"
          onTouchStart={setCrosshairOnHover}
          onTouchMove={setCrosshairOnHover}
          onMouseMove={setCrosshairOnHover}
          onMouseLeave={resetCrosshair}
        />
      </svg>
    </>
  )
}

const CHART_ERROR_MESSAGES: Record<ChartErrorType, ReactNode> = {
  [ChartErrorType.NO_DATA_AVAILABLE]: <Trans>Missing chart data</Trans>,
  [ChartErrorType.NO_RECENT_VOLUME]: <Trans>Missing price data due to recently low trading volume on Uniswap v3</Trans>,
  [ChartErrorType.INVALID_CHART]: <Trans>Invalid Chart</Trans>,
}

function MissingPriceChart({ chart }: { chart: ErroredChartModel }) {
  const theme = useTheme()
  const midPoint = chart.dimensions.height / 2 + 45

  return (
    <>
      <ChartHeaderWrapper data-cy="chart-header">
        <ThemedText.HeadlineLarge fontSize={24} color="neutral3">
          Price Unavailable
        </ThemedText.HeadlineLarge>
        <ThemedText.BodySmall color="neutral3">{CHART_ERROR_MESSAGES[chart.error]}</ThemedText.BodySmall>
      </ChartHeaderWrapper>
      <svg
        data-cy="missing-chart"
        width={chart.dimensions.width}
        height={chart.dimensions.height}
        style={{ minWidth: '100%' }}
      >
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

interface PriceChartProps {
  width: number
  height: number
  prices?: PricePoint[]
  timePeriod: TimePeriod
}

export function PriceChart({ width, height, prices, timePeriod }: PriceChartProps) {
  const chart = useMemo(
    () =>
      buildChartModel({
        dimensions: { width, height, marginBottom: CHART_MARGIN.bottom, marginTop: CHART_MARGIN.top },
        prices,
      }),
    [width, height, prices]
  )

  if (chart.error !== undefined) {
    return <MissingPriceChart chart={chart} />
  }

  return <ChartBody chart={chart} timePeriod={timePeriod} />
}
