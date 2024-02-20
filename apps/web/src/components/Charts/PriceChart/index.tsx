import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart, ChartModel, ChartModelParams } from 'components/Charts/ChartModel'
import { getCandlestickPriceBounds } from 'components/Charts/PriceChart/utils'
import { PriceChartType } from 'components/Charts/utils'
import { DeltaArrow, DeltaText, calculateDelta } from 'components/Tokens/TokenDetails/Delta'
import { PricePoint } from 'graphql/data/util'
import {
  AreaData,
  BarPrice,
  CandlestickData,
  IPriceLine,
  ISeriesApi,
  LineStyle,
  LineType,
  PriceLineOptions,
  UTCTimestamp,
} from 'lightweight-charts'
import { useMemo } from 'react'
import styled from 'styled-components'
import { opacify } from 'theme/utils'
import { NumberType, useFormatter } from 'utils/formatNumbers'

type PriceChartData = CandlestickData<UTCTimestamp> & AreaData<UTCTimestamp>

interface PriceChartModelParams extends ChartModelParams<PriceChartData> {
  type: PriceChartType
}

const LOW_PRICE_RANGE_THRESHOLD = 0.2
const LOW_PRICE_RANGE_SCALE_FACTOR = 1000000000

export class PriceChartModel extends ChartModel<PriceChartData> {
  protected series: ISeriesApi<'Area' | 'Candlestick'>
  private originalData: PriceChartData[]
  private lowPriceRangeScaleFactor = 1
  private type: PriceChartType
  private minPriceLine: IPriceLine | undefined
  private maxPriceLine: IPriceLine | undefined
  private priceLineOptions: Partial<PriceLineOptions> | undefined
  private min: number
  private max: number

  constructor(chartDiv: HTMLDivElement, params: PriceChartModelParams) {
    super(chartDiv, params)
    this.originalData = this.data

    const { adjustedData, lowPriceRangeScaleFactor, min, max } = PriceChartModel.getAdjustedPrices(params.data)
    this.data = adjustedData
    this.lowPriceRangeScaleFactor = lowPriceRangeScaleFactor
    this.min = min
    this.max = max

    this.type = params.type
    this.series = this.type === PriceChartType.LINE ? this.api.addAreaSeries() : this.api.addCandlestickSeries()
    this.series.setData(this.data)
    this.updateOptions(params)
    this.fitContent()
  }

  private static applyPriceScaleFactor(data: PriceChartData, scaleFactor: number): PriceChartData {
    return {
      time: data.time,
      value: (data.value || data.close) * scaleFactor,
      open: data.open * scaleFactor,
      close: data.close * scaleFactor,
      high: data.high * scaleFactor,
      low: data.low * scaleFactor,
    }
  }

  private static getAdjustedPrices(data: PriceChartData[]) {
    let lowPriceRangeScaleFactor = 1
    let adjustedData = data
    let { min, max } = getCandlestickPriceBounds(data)

    // Lightweight-charts shows few price-axis points for low-value/volatility tokens,
    // so we workaround by "scaling" the prices, causing more price-axis points to be shown
    if (max - min < LOW_PRICE_RANGE_THRESHOLD) {
      lowPriceRangeScaleFactor = LOW_PRICE_RANGE_SCALE_FACTOR
      adjustedData = data.map((point) => this.applyPriceScaleFactor(point, lowPriceRangeScaleFactor))
      min = min * lowPriceRangeScaleFactor
      max = max * lowPriceRangeScaleFactor
    }

    return { adjustedData, lowPriceRangeScaleFactor, min, max }
  }

  updateOptions(params: PriceChartModelParams) {
    const { data, theme, type, locale, format } = params
    super.updateOptions(params, {
      localization: {
        locale,
        priceFormatter: (price: BarPrice) => {
          return format.formatFiatPrice({
            // Transform price back to original value if it was scaled
            price: Number(price) / this.lowPriceRangeScaleFactor,
            type: NumberType.ChartFiatValue,
          })
        },
      },
      grid: {
        vertLines: { style: LineStyle.CustomDotGrid, visible: true },
        horzLines: { style: LineStyle.CustomDotGrid, visible: true },
      },
    })

    // Handles changing between line/candlestick view
    if (this.type !== type) {
      this.type = params.type
      this.api.removeSeries(this.series)
      this.series = this.type === PriceChartType.LINE ? this.api.addAreaSeries() : this.api.addCandlestickSeries()
      this.series.setData(this.data)
    }
    // Handles changes in data, e.g. time period selection
    if (this.originalData !== data) {
      this.originalData = data
      const { adjustedData, lowPriceRangeScaleFactor, min, max } = PriceChartModel.getAdjustedPrices(data)
      this.data = adjustedData
      this.lowPriceRangeScaleFactor = lowPriceRangeScaleFactor
      this.min = min
      this.max = max

      this.series.setData(this.data)
      this.fitContent()
    }

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

    this.priceLineOptions = {
      color: theme.surface3,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelColor: theme.neutral3,
      axisLabelTextColor: theme.neutral2,
    }
    this.minPriceLine?.applyOptions({ price: this.min, ...this.priceLineOptions })
    this.maxPriceLine?.applyOptions({ price: this.max, ...this.priceLineOptions })
  }

  override onSeriesHover(data: PriceChartData | undefined, index: number | undefined) {
    // Use original data point for hover functionality rather than scaled data
    super.onSeriesHover(index !== undefined ? this.originalData[index] : undefined, index)

    // Hide/display price lines based on hover
    if (data === undefined) {
      if (this.minPriceLine && this.maxPriceLine) {
        this.series.removePriceLine(this.minPriceLine)
        this.series.removePriceLine(this.maxPriceLine)
        this.minPriceLine = undefined
        this.maxPriceLine = undefined
      }
    } else if (!this.minPriceLine && !this.maxPriceLine && this.min && this.max) {
      this.minPriceLine = this.series.createPriceLine({ price: this.min, ...this.priceLineOptions })
      this.maxPriceLine = this.series.createPriceLine({ price: this.max, ...this.priceLineOptions })
    }
  }
}

const DeltaContainer = styled.div`
  font-size: 16px;
  line-height: 24px;
  display: flex;
  align-items: center;
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
      <DeltaText delta={delta}>{formatDelta(delta)}</DeltaText>
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
