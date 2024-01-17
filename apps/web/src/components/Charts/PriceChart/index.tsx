import { Trans } from '@lingui/macro'
import { Chart, ChartModel, ChartModelParams } from 'components/Charts/ChartModel'
import { useHeaderDateFormatter } from 'components/Charts/hooks'
import { getCandlestickPriceBounds } from 'components/Charts/PriceChart/utils'
import { PriceChartType } from 'components/Charts/utils'
import { calculateDelta, DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { MouseoverTooltip } from 'components/Tooltip'
import { PricePoint } from 'graphql/data/util'
import { useActiveLocale } from 'hooks/useActiveLocale'
import {
  AreaData,
  CandlestickData,
  IPriceLine,
  ISeriesApi,
  LineStyle,
  LineType,
  PriceLineOptions,
  UTCTimestamp,
} from 'lightweight-charts'
import React, { useMemo, useState } from 'react'
import { Info } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { opacify } from 'theme/utils'
import { useFormatter } from 'utils/formatNumbers'

type PriceChartData = CandlestickData<UTCTimestamp> & AreaData<UTCTimestamp>

interface PriceChartModelParams extends ChartModelParams<PriceChartData> {
  type: PriceChartType
}

class PriceChartModel extends ChartModel<PriceChartData> {
  protected series: ISeriesApi<'Area' | 'Candlestick'>
  private type: PriceChartType
  private minPriceLine: IPriceLine
  private maxPriceLine: IPriceLine

  constructor(chartDiv: HTMLDivElement, params: PriceChartModelParams) {
    super(chartDiv, params)

    this.type = params.type
    this.series = this.type === PriceChartType.LINE ? this.api.addAreaSeries() : this.api.addCandlestickSeries()
    this.series.setData(this.data)
    this.minPriceLine = this.series.createPriceLine({ price: 0 })
    this.maxPriceLine = this.series.createPriceLine({ price: 0 })
    this.updateOptions(params)
    this.fitContent()
  }

  updateOptions(params: PriceChartModelParams) {
    super.updateOptions(params) // applies default options for all charts
    const { data, theme, type } = params

    // Handles changing between line/candlestick view
    if (this.type !== type) {
      this.type = params.type
      this.api.removeSeries(this.series)
      this.series = this.type === PriceChartType.LINE ? this.api.addAreaSeries() : this.api.addCandlestickSeries()
      this.series.setData(data)

      // Removing the series removes pricelines as well; new ones are initialized here and configured further below
      this.minPriceLine = this.series.createPriceLine({ price: 0 })
      this.maxPriceLine = this.series.createPriceLine({ price: 0 })
    }

    // Handles changes in data, e.g. time period selection
    if (this.data !== data) {
      this.data = data
      this.series.setData(data)
      this.fitContent()
    }

    const { min, max } = getCandlestickPriceBounds(data)

    this.series.applyOptions({
      priceLineVisible: false,
      lastValueVisible: false,

      // Line-specific options:
      lineType: data.length < 20 ? LineType.WithSteps : LineType.Curved, // Stepped line is visually preferred for smaller datasets
      lineWidth: 2,
      lineColor: theme.accent1,
      topColor: opacify(12, theme.accent1),
      bottomColor: opacify(12, theme.accent1),
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: opacify(30, theme.accent1),
      crosshairMarkerBorderWidth: 3,

      // Candlestick-specific options:
      upColor: theme.success,
      wickUpColor: theme.success,
      downColor: theme.critical,
      wickDownColor: theme.critical,
      borderVisible: false,
    })

    const priceLineOptions: Partial<PriceLineOptions> = {
      color: theme.surface3,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelColor: theme.neutral3,
      axisLabelTextColor: theme.neutral2,
    }

    this.minPriceLine.applyOptions({ price: min, ...priceLineOptions })
    this.maxPriceLine.applyOptions({ price: max, ...priceLineOptions })
  }
}

const ChartHeaderWrapper = styled.div<{ stale?: boolean }>`
  position: absolute;
  ${textFadeIn};
  animation-duration: ${({ theme }) => theme.transition.duration.medium};
  ${({ theme, stale }) => stale && `color: ${theme.neutral2}`};

  display: flex;
  flex-direction: column;
  gap: 4px;
`
const PriceContainer = styled.div`
  display: flex;
  gap: 6px;
  line-height: 50px;
`
const DeltaContainer = styled.div`
  height: 16px;
  display: flex;
  align-items: center;
  margin-top: 4px;
  color: ${({ theme }) => theme.neutral2};
`

const mockCandlestickData = (prices: PricePoint[] | undefined): PriceChartData[] => {
  if (!prices) return []

  let minIndex = 0
  let maxIndex = 0

  const mockedData = prices.map((pricePoint, index) => {
    const open = index > 0 ? prices[index - 1].value : pricePoint.value * 0.9992
    const close = pricePoint.value
    const high = pricePoint.value + Math.abs(open - close) * 0.5
    const low = pricePoint.value - Math.abs(close - open) * 0.5

    if (prices[minIndex].value > pricePoint.value) {
      minIndex = index
    }
    if (prices[maxIndex].value < pricePoint.value) {
      maxIndex = index
    }

    return { value: pricePoint.value, time: pricePoint.timestamp as UTCTimestamp, open, close, high, low }
  })

  // Fixes extrema on line charts to match the low/high price lines
  mockedData[minIndex].value = mockedData[minIndex].low
  mockedData[maxIndex].value = mockedData[maxIndex].high

  return mockedData
}

interface PriceChartDeltaProps {
  startingPrice: PriceChartData
  endingPrice: PriceChartData
  noColor?: boolean
}

function PriceChartDelta({ startingPrice, endingPrice, noColor }: PriceChartDeltaProps) {
  const delta = calculateDelta(startingPrice.close ?? startingPrice.value, endingPrice.close ?? endingPrice.value)
  const { formatDelta } = useFormatter()

  return (
    <DeltaContainer>
      {formatDelta(delta)}
      <DeltaArrow delta={delta} noColor={noColor} />
    </DeltaContainer>
  )
}

function PriceChartHeader({ crosshairPrice, data }: { crosshairPrice?: PriceChartData; data: PriceChartData[] }) {
  const { formatFiatPrice } = useFormatter()
  const headerDateFormatter = useHeaderDateFormatter()

  const startingPrice = data[0]
  const endingPrice = data[data.length - 1]

  const lastValidPrice = useMemo(
    () => [...data].reverse().find((price) => price.close !== 0 || price.value !== 0),
    [data]
  )

  const priceOutdated = lastValidPrice !== endingPrice
  const displayPrice = crosshairPrice ?? lastValidPrice ?? startingPrice

  const displayIsStale = priceOutdated && !crosshairPrice
  return (
    <ChartHeaderWrapper data-cy="chart-header" stale={displayIsStale}>
      <PriceContainer>
        <ThemedText.HeadlineLarge color="inherit">
          {formatFiatPrice({ price: displayPrice?.close ?? displayPrice.value })}
        </ThemedText.HeadlineLarge>
        {displayIsStale && (
          <MouseoverTooltip text={<Trans>This price may not be up-to-date due to low trading volume.</Trans>}>
            <Info size={16} data-testid="chart-stale-icon" />
          </MouseoverTooltip>
        )}
      </PriceContainer>
      <ThemedText.Caption color="neutral2">{headerDateFormatter(displayPrice?.time)}</ThemedText.Caption>
      <PriceChartDelta startingPrice={startingPrice} endingPrice={displayPrice} noColor={priceOutdated} />
    </ChartHeaderWrapper>
  )
}

interface PriceChartProps {
  type: PriceChartType
  height: number
  prices?: PricePoint[]
}

export function PriceChart({ height, prices, type }: PriceChartProps) {
  const mockedPrices = useMemo(() => mockCandlestickData(prices), [prices]) // TODO(info) - update to use real candlestick data
  const locale = useActiveLocale()
  const theme = useTheme()
  const format = useFormatter()
  const [crosshairPrice, setCrosshairPrice] = useState<PriceChartData>()

  const params: PriceChartModelParams = useMemo(() => {
    return { data: mockedPrices, locale, theme, format, type, onCrosshairMove: setCrosshairPrice }
  }, [mockedPrices, locale, theme, format, type])

  return (
    <>
      <PriceChartHeader crosshairPrice={crosshairPrice} data={mockedPrices} />
      <Chart Model={PriceChartModel} params={params} height={height} />
    </>
  )
}
