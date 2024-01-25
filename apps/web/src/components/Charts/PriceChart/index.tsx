import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart, ChartModel, ChartModelParams } from 'components/Charts/ChartModel'
import { getCandlestickPriceBounds } from 'components/Charts/PriceChart/utils'
import { PriceChartType } from 'components/Charts/utils'
import { calculateDelta, DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { PricePoint } from 'graphql/data/util'
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
import React, { useMemo } from 'react'
import styled from 'styled-components'
import { opacify } from 'theme/utils'
import { NumberType, useFormatter } from 'utils/formatNumbers'

type PriceChartData = CandlestickData<UTCTimestamp> & AreaData<UTCTimestamp>

interface PriceChartModelParams extends ChartModelParams<PriceChartData> {
  type: PriceChartType
}

export class PriceChartModel extends ChartModel<PriceChartData> {
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

const DeltaContainer = styled.div`
  height: 16px;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.neutral2};
  gap: 4px;
`

export const mockCandlestickData = (prices: PricePoint[] | undefined): PriceChartData[] => {
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

export function PriceChartDelta({ startingPrice, endingPrice, noColor }: PriceChartDeltaProps) {
  const delta = calculateDelta(startingPrice.close ?? startingPrice.value, endingPrice.close ?? endingPrice.value)
  const { formatDelta } = useFormatter()

  return (
    <DeltaContainer>
      <DeltaArrow delta={delta} noColor={noColor} />
      {formatDelta(delta)}
    </DeltaContainer>
  )
}

interface PriceChartProps {
  type: PriceChartType
  height: number
  prices?: PricePoint[]
}

export function PriceChart({ height, prices, type }: PriceChartProps) {
  const mockedPrices = useMemo(() => mockCandlestickData(prices), [prices]) // TODO(info) - update to use real candlestick data
  const params = useMemo(() => ({ data: mockedPrices, type }), [mockedPrices, type])

  // TODO(WEB-3430): Add error state for lack of data
  if (!mockedPrices.length) return null

  const lastPrice = mockedPrices[mockedPrices.length - 1]
  return (
    <Chart Model={PriceChartModel} params={params} height={height}>
      {(crosshairData) => (
        <ChartHeader
          value={(crosshairData ?? lastPrice).value ?? (crosshairData ?? lastPrice).close}
          additionalFields={
            <PriceChartDelta startingPrice={mockedPrices[0]} endingPrice={crosshairData ?? lastPrice} />
          }
          valueFormatterType={NumberType.FiatTokenPrice}
          time={crosshairData?.time}
        />
      )}
    </Chart>
  )
}
