import { GraphQLApi } from '@universe/api'
import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart, ChartHoverData, ChartModel, ChartModelParams } from 'components/Charts/ChartModel'
import {
  RoundedCandleSeries,
  RoundedCandleSeriesOptions,
} from 'components/Charts/PriceChart/RoundedCandlestickSeries/rounded-candles-series'
import { getCandlestickPriceBounds } from 'components/Charts/PriceChart/utils'
import { PriceChartType } from 'components/Charts/utils'
import { calculateDelta, DeltaArrow, DeltaText } from 'components/Tokens/TokenDetails/Delta'
import {
  AreaData,
  AreaSeriesPartialOptions,
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
import { Trans } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { isLowVarianceRange } from 'uniswap/src/components/charts/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export type PriceChartData = CandlestickData<UTCTimestamp> & AreaData<UTCTimestamp>

interface PriceChartModelParams extends ChartModelParams<PriceChartData> {
  type: PriceChartType
  timePeriod?: GraphQLApi.HistoryDuration
}

const LOW_PRICE_RANGE_THRESHOLD = 0.2
const LOW_PRICE_RANGE_SCALE_FACTOR = 1000000000

export class PriceChartModel extends ChartModel<PriceChartData> {
  protected series: ISeriesApi<'Area'> | ISeriesApi<'Custom'>
  private originalData: PriceChartData[]
  private lowPriceRangeScaleFactor = 1
  private type: PriceChartType
  private timePeriod?: GraphQLApi.HistoryDuration
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
    this.timePeriod = params.timePeriod
    this.series =
      this.type === PriceChartType.LINE ? this.api.addAreaSeries() : this.api.addCustomSeries(new RoundedCandleSeries())
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
    const { data, theme, type, locale, format, tokenFormatType } = params
    const { min, max } = getCandlestickPriceBounds(data)

    // Handles changes in time period
    if (this.timePeriod !== params.timePeriod) {
      this.timePeriod = params.timePeriod
    }

    const shouldZoomOut = isLowVarianceRange({ min, max, duration: this.timePeriod })

    // Zoom out y-axis for low-variance assets
    const scaleMargins = shouldZoomOut
      ? {
          top: 0.49,
          bottom: 0.49,
        }
      : undefined

    super.updateOptions(params, {
      localization: {
        locale,
        priceFormatter: (price: BarPrice) => {
          if (tokenFormatType) {
            return format.formatNumberOrString({
              value: Number(price) / this.lowPriceRangeScaleFactor,
              type: tokenFormatType,
            })
          }
          return format.convertFiatAmountFormatted(
            // Transform price back to original value if it was scaled
            Number(price) / this.lowPriceRangeScaleFactor,
            NumberType.FiatTokenPrice,
          )
        },
      },
      grid: {
        vertLines: { style: LineStyle.CustomDotGrid, color: theme.neutral3 },
        horzLines: { style: LineStyle.CustomDotGrid, color: theme.neutral3 },
      },
      ...(scaleMargins && {
        rightPriceScale: {
          scaleMargins,
        },
      }),
    })

    // Handles changing between line/candlestick view
    if (this.type !== type) {
      this.type = params.type
      this.api.removeSeries(this.series)
      if (this.type === PriceChartType.CANDLESTICK) {
        this.series = this.api.addCustomSeries(new RoundedCandleSeries())
      } else {
        this.series = this.api.addAreaSeries()
      }
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

    // Use theme.accent1 which will be the token color when inside TokenColorThemeProvider
    const lineColor = theme.accent1

    this.series.applyOptions({
      priceLineVisible: false,
      lastValueVisible: false,

      // Line-specific options:
      lineType: data.length < 20 ? LineType.WithSteps : LineType.Curved, // Stepped line is visually preferred for smaller datasets
      lineWidth: 2,
      lineColor,
      topColor: opacify(12, lineColor),
      bottomColor: opacify(12, lineColor),
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: opacify(30, lineColor),
      crosshairMarkerBorderWidth: 3,

      // Candlestick-specific options:
      upColor: theme.success,
      wickUpColor: theme.success,
      downColor: theme.critical,
      wickDownColor: theme.critical,
      borderVisible: false,
    } as Partial<RoundedCandleSeriesOptions> & AreaSeriesPartialOptions)

    this.priceLineOptions = {
      color: theme.surface3,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelColor: theme.surface3Solid,
      axisLabelTextColor: theme.neutral1,
    }
    this.minPriceLine?.applyOptions({ price: this.min, ...this.priceLineOptions })
    this.maxPriceLine?.applyOptions({ price: this.max, ...this.priceLineOptions })
  }

  override onSeriesHover(hoverData?: ChartHoverData<CandlestickData>) {
    if (hoverData) {
      // Use original data point for hover functionality rather than data that has been scaled by lowPriceRangeScaleFactor
      const originalItem = this.originalData[hoverData.logicalIndex]
      const updatedHoverData = { ...hoverData, item: originalItem }
      super.onSeriesHover(updatedHoverData)
    } else {
      super.onSeriesHover(undefined)
    }

    // Hide/display price lines based on hover
    if (hoverData === undefined) {
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

interface PriceChartDeltaProps {
  startingPrice: PriceChartData
  endingPrice: PriceChartData
  noColor?: boolean
}

export function PriceChartDelta({ startingPrice, endingPrice, noColor }: PriceChartDeltaProps) {
  const delta = calculateDelta(startingPrice.close, endingPrice.close)
  const { formatPercent } = useLocalizationContext()

  return (
    <Text variant="body2" display="flex" alignItems="center" gap="$gap4">
      {delta && <DeltaArrow delta={delta} formattedDelta={formatPercent(Math.abs(delta))} noColor={noColor} />}
      <DeltaText delta={delta}>{delta ? formatPercent(Math.abs(delta)) : '-'}</DeltaText>
    </Text>
  )
}

interface PriceChartProps {
  type: PriceChartType
  height: number
  data: PriceChartData[]
  stale: boolean
  timePeriod?: GraphQLApi.HistoryDuration
}

const CandlestickTooltipRow = styled(Flex, {
  row: true,
  justifyContent: 'space-between',
  gap: '$sm',
})

function CandlestickTooltip({ data }: { data: PriceChartData }) {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  return (
    <>
      <Text variant="body3" color="$neutral1">
        <CandlestickTooltipRow>
          <Trans i18nKey="chart.price.label.open" />
          <Flex>{convertFiatAmountFormatted(data.open, NumberType.FiatTokenPrice)}</Flex>
        </CandlestickTooltipRow>
        <CandlestickTooltipRow>
          <Trans i18nKey="chart.price.label.high" />
          <Flex>{convertFiatAmountFormatted(data.high, NumberType.FiatTokenPrice)}</Flex>
        </CandlestickTooltipRow>
        <CandlestickTooltipRow>
          <Trans i18nKey="chart.price.label.low" />
          <Flex>{convertFiatAmountFormatted(data.low, NumberType.FiatTokenPrice)}</Flex>
        </CandlestickTooltipRow>
        <CandlestickTooltipRow>
          <Trans i18nKey="chart.price.label.close" />
          <Flex>{convertFiatAmountFormatted(data.close, NumberType.FiatTokenPrice)}</Flex>
        </CandlestickTooltipRow>
      </Text>
    </>
  )
}

export function PriceChart({ data, height, type, stale, timePeriod }: PriceChartProps) {
  const lastPrice = data[data.length - 1]

  return (
    <Chart
      Model={PriceChartModel}
      params={useMemo(() => ({ data, type, stale, timePeriod }), [data, stale, type, timePeriod])}
      height={height}
      TooltipBody={type === PriceChartType.CANDLESTICK ? CandlestickTooltip : undefined}
    >
      {(crosshairData) => (
        <ChartHeader
          value={(crosshairData ?? lastPrice).value}
          additionalFields={<PriceChartDelta startingPrice={data[0]} endingPrice={crosshairData ?? lastPrice} />}
          valueFormatterType={NumberType.FiatTokenPrice}
          time={crosshairData?.time}
        />
      )}
    </Chart>
  )
}
