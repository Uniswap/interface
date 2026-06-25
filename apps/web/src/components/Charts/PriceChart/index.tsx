import { GraphQLApi } from '@universe/api'
import {
  AreaData,
  AreaSeriesPartialOptions,
  BarPrice,
  CandlestickData,
  CrosshairMode,
  IPriceLine,
  ISeriesApi,
  LineStyle,
  LineType,
  PriceLineOptions,
  UTCTimestamp,
} from 'lightweight-charts'
import { ReactElement, ReactNode, useMemo } from 'react'
import { Flex } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { isLowVarianceRange } from 'uniswap/src/components/charts/utils'
import { NumberType } from 'utilities/src/format/types'
import { ChartHeader } from '~/components/Charts/ChartHeader'
import {
  Chart,
  ChartHoverCoordinates,
  ChartHoverData,
  ChartModel,
  ChartModelParams,
  DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
  DEFAULT_TOP_PRICE_SCALE_MARGIN,
} from '~/components/Charts/ChartModel'
import { CandlestickTooltip } from '~/components/Charts/PriceChart/CandlestickTooltip'
import { PriceChartDelta } from '~/components/Charts/PriceChart/PriceChartDelta'
import {
  RoundedCandleSeries,
  RoundedCandleSeriesOptions,
} from '~/components/Charts/PriceChart/RoundedCandlestickSeries/rounded-candles-series'
import { getCandlestickPriceBounds } from '~/components/Charts/PriceChart/utils'
import { PriceChartType } from '~/components/Charts/utils'

export type PriceChartData = CandlestickData<UTCTimestamp> & AreaData<UTCTimestamp>

interface PriceChartModelParams extends ChartModelParams<PriceChartData> {
  type: PriceChartType
  timePeriod?: GraphQLApi.HistoryDuration
  hideYAxis?: boolean
  hideXAxis?: boolean
  yAxisFormatter?: (price: number) => string
  sparkline?: boolean
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

  /**
   * Gets the screen coordinates for the last data point
   * Returns null for candlestick charts since they don't need a live dot indicator
   */
  getLastPointCoordinates(): { x: number; y: number } | null {
    // Only show live dot for line charts
    if (this.type === PriceChartType.CANDLESTICK) {
      return null
    }

    if (this.data.length === 0) {
      return null
    }

    const lastDataPoint = this.data[this.data.length - 1]
    const xCoordinate = this.api.timeScale().timeToCoordinate(lastDataPoint.time)
    const yCoordinate = this.series.priceToCoordinate((lastDataPoint as AreaData<UTCTimestamp>).value)

    if (xCoordinate == null || yCoordinate == null) {
      return null
    }

    return {
      x: Number(xCoordinate) + this.api.priceScale('left').width(),
      y: Number(yCoordinate),
    }
  }

  /**
   * Gets the screen coordinates for the hovered data point on the line
   * Returns null if not hovering or for candlestick charts
   */
  override getHoverCoordinates(): { x: number; y: number } | null {
    // Only show custom marker for line charts
    if (this.type === PriceChartType.CANDLESTICK) {
      return null
    }

    const hoverData = (this as any)._hoverData
    if (!hoverData || !hoverData.item) {
      return null
    }

    // Calculate x from time
    const xCoordinate = this.api.timeScale().timeToCoordinate(hoverData.item.time)
    // Calculate y from the data point's value (not mouse position)
    const yCoordinate = this.series.priceToCoordinate((hoverData.item as AreaData<UTCTimestamp>).value)

    if (xCoordinate == null || yCoordinate == null) {
      return null
    }

    return {
      x: Number(xCoordinate) + this.api.priceScale('left').width(),
      y: Number(yCoordinate),
    }
  }

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
    const { data, colors, type, locale, format, tokenFormatType, hideYAxis, hideXAxis, yAxisFormatter, sparkline } =
      params
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
      : {
          top: DEFAULT_TOP_PRICE_SCALE_MARGIN,
          bottom: DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
        }

    super.updateOptions(params, {
      timeScale: {
        visible: !sparkline && !hideXAxis,
      },
      ...(sparkline && {
        crosshair: { mode: CrosshairMode.Hidden },
      }),
      localization: {
        locale,
        priceFormatter: (price: BarPrice) => {
          // Transform price back to original value if it was scaled
          const originalPrice = Number(price) / this.lowPriceRangeScaleFactor

          // Use custom y-axis formatter if provided
          if (yAxisFormatter) {
            return yAxisFormatter(originalPrice)
          }

          if (tokenFormatType) {
            return format.formatNumberOrString({
              value: originalPrice,
              type: tokenFormatType,
            })
          }
          return format.convertFiatAmountFormatted(originalPrice, NumberType.FiatTokenPrice)
        },
      },
      rightPriceScale: {
        borderVisible: false,
        ...(hideYAxis && { visible: false, minimumWidth: 0 }),
        scaleMargins,
      },
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
      // oxlint-disable-next-line no-shadow
      const { adjustedData, lowPriceRangeScaleFactor, min, max } = PriceChartModel.getAdjustedPrices(data)
      this.data = adjustedData
      this.lowPriceRangeScaleFactor = lowPriceRangeScaleFactor
      this.min = min
      this.max = max

      this.series.setData(this.data)
      this.fitContent()
    }

    // Use colors.accent1 which will be the token color when inside TokenColorThemeProvider
    const lineColor = colors.accent1.val

    this.series.applyOptions({
      priceLineVisible: false,
      lastValueVisible: false,

      // Line-specific options:
      lineType: data.length < 20 ? LineType.WithSteps : LineType.Curved, // Stepped line is visually preferred for smaller datasets
      lineWidth: 2,
      lineColor,
      topColor: lineColor,
      bottomColor: opacify(0, colors.surface1.val),
      // Hide default marker - we use a custom marker instead
      crosshairMarkerRadius: 0,

      // Candlestick-specific options:
      upColor: colors.statusSuccess.val,
      wickUpColor: colors.statusSuccess.val,
      downColor: colors.statusCritical.val,
      wickDownColor: colors.statusCritical.val,
      borderVisible: false,
    } as Partial<RoundedCandleSeriesOptions> & AreaSeriesPartialOptions)

    this.priceLineOptions = {
      color: colors.surface3.val,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelColor: colors.surface3Solid.val,
      axisLabelTextColor: colors.neutral1.val,
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

interface PriceChartBodyProps {
  type: PriceChartType
  height: number
  data: PriceChartData[]
  stale: boolean
  timePeriod?: GraphQLApi.HistoryDuration
  overrideColor?: string
  hideYAxis?: boolean
  hideXAxis?: boolean
  yAxisFormatter?: (price: number) => string
  sparkline?: boolean
  onCrosshairChange?: (crosshairData?: PriceChartData) => void
  /** Optional overlay render prop with access to the chart's crosshair data, hover pixel coordinates, and plot right edge. */
  children?: (crosshairData?: PriceChartData, hover?: ChartHoverCoordinates | null) => ReactElement | null
}

export function PriceChartBody({
  data,
  height,
  type,
  stale,
  timePeriod,
  overrideColor,
  hideYAxis,
  hideXAxis,
  yAxisFormatter,
  sparkline,
  onCrosshairChange,
  children,
}: PriceChartBodyProps) {
  return (
    <Chart
      Model={PriceChartModel}
      params={useMemo(
        () => ({ data, type, stale, timePeriod, hideYAxis, hideXAxis, yAxisFormatter, sparkline }),
        [data, stale, type, timePeriod, hideYAxis, hideXAxis, yAxisFormatter, sparkline],
      )}
      height={height}
      overrideColor={overrideColor}
      TooltipBody={type === PriceChartType.CANDLESTICK ? CandlestickTooltip : undefined}
      onCrosshairChange={onCrosshairChange}
      showDottedBackground={true}
      showLeftFadeOverlay={type === PriceChartType.LINE}
      showCustomHoverMarker={type === PriceChartType.LINE}
    >
      {children}
    </Chart>
  )
}

interface PriceChartProps {
  type: PriceChartType
  height: number
  data: PriceChartData[]
  stale: boolean
  timePeriod?: GraphQLApi.HistoryDuration
  pricePercentChange?: number
  overrideColor?: string
  headerTotalValueOverride?: number
  hideYAxis?: boolean
  hidePercentDelta?: boolean
  yAxisFormatter?: (price: number) => string
  /** Additional content rendered next to the price delta in the chart header.
   *  Can be a ReactNode or a render function receiving { isHovering }. */
  additionalHeaderContent?: ReactNode | (({ isHovering }: { isHovering: boolean }) => ReactNode)
}

export function PriceChart({
  data,
  height,
  type,
  stale,
  timePeriod,
  pricePercentChange,
  overrideColor,
  headerTotalValueOverride,
  hideYAxis,
  yAxisFormatter,
  additionalHeaderContent,
  hidePercentDelta,
}: PriceChartProps) {
  const startingPrice = data[0]
  const lastPrice = data[data.length - 1]
  const { min, max } = getCandlestickPriceBounds(data)
  const shouldTreatAsStablecoin = isLowVarianceRange({
    min,
    max,
    duration: timePeriod,
  })

  return (
    <PriceChartBody
      data={data}
      height={height}
      type={type}
      stale={stale}
      timePeriod={timePeriod}
      overrideColor={overrideColor}
      hideYAxis={hideYAxis}
      yAxisFormatter={yAxisFormatter}
    >
      {(crosshairData) => {
        const headerValue = crosshairData ? crosshairData.value : (headerTotalValueOverride ?? lastPrice.value)

        return (
          <ChartHeader
            value={headerValue}
            additionalFields={
              <Flex row gap="$gap8" alignItems="center">
                <PriceChartDelta
                  startingPrice={startingPrice.close}
                  endingPrice={(crosshairData ?? lastPrice).close}
                  shouldIncludeFiatDelta
                  shouldTreatAsStablecoin={shouldTreatAsStablecoin}
                  pricePercentChange={pricePercentChange}
                  isHovering={!!crosshairData}
                  hidePercent={hidePercentDelta}
                />
                {typeof additionalHeaderContent === 'function'
                  ? additionalHeaderContent({ isHovering: !!crosshairData })
                  : additionalHeaderContent}
              </Flex>
            }
            valueFormatterType={NumberType.FiatTokenPrice}
            time={crosshairData?.time}
          />
        )
      }}
    </PriceChartBody>
  )
}
