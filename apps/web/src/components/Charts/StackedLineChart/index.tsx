import { getProtocolColor } from 'appGraphql/data/util'
import { GraphQLApi } from '@universe/api'
import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart, ChartModel, ChartModelParams } from 'components/Charts/ChartModel'
import { StackedAreaSeriesOptions } from 'components/Charts/StackedLineChart/stacked-area-series/options'
import { StackedAreaSeries } from 'components/Charts/StackedLineChart/stacked-area-series/stacked-area-series'
import { CustomStyleOptions, DeepPartial, ISeriesApi, Logical, UTCTimestamp, WhitespaceData } from 'lightweight-charts'
import { useMemo } from 'react'
import { ColorTokens, useSporeColors } from 'ui/src'

export interface StackedLineData extends WhitespaceData<UTCTimestamp> {
  values: number[]
}

interface TVLChartParams extends ChartModelParams<StackedLineData> {
  colors: ColorTokens[]
  gradients?: { start: string; end: string }[]
}

class TVLChartModel extends ChartModel<StackedLineData> {
  protected series: ISeriesApi<'Custom'>

  private hoveredLogicalIndex: Logical | null | undefined

  constructor(chartDiv: HTMLDivElement, params: TVLChartParams) {
    super(chartDiv, params)

    this.series = this.api.addCustomSeries(new StackedAreaSeries(), {} as DeepPartial<CustomStyleOptions>)

    this.series.setData(this.data)
    this.updateOptions(params)
    this.fitContent()

    this.api.subscribeCrosshairMove((param) => {
      if (param.logical !== this.hoveredLogicalIndex) {
        this.hoveredLogicalIndex = param.logical
        this.series.applyOptions({
          hoveredLogicalIndex: this.hoveredLogicalIndex ?? (-1 as Logical), // -1 is used because series will use prev value if undefined is passed
        } as DeepPartial<StackedAreaSeriesOptions>)
      }
    })
  }

  updateOptions(params: TVLChartParams) {
    const isSingleLineChart = params.colors.length === 1

    super.updateOptions(params, {
      handleScale: false,
      handleScroll: false,
      rightPriceScale: {
        visible: isSingleLineChart, // Hide pricescale on multi-line charts
        borderVisible: false,
        scaleMargins: {
          top: 0.25,
          bottom: 0,
        },
        autoScale: true,
      },
    })
    const { data, colors, gradients } = params

    // Handles changes in data, e.g. time period selection
    if (this.data !== data) {
      this.data = data
      this.series.setData(data)
      this.fitContent()
    }

    // For single line charts, use theme.accent1 as the color - this will be the token color in TokenDetails
    const effectiveColors = isSingleLineChart ? [params.theme.accent1] : colors

    this.series.applyOptions({
      priceLineVisible: false,
      lastValueVisible: false,
      colors: effectiveColors,
      gradients,
      lineWidth: 2.5,
    } as DeepPartial<StackedAreaSeriesOptions>)
  }
}

interface LineChartProps {
  height: number
  sources?: GraphQLApi.PriceSource[]
  data: StackedLineData[]
  stale: boolean
}

export function LineChart({ height, data, sources, stale }: LineChartProps) {
  const sporeColors = useSporeColors()
  // Theme handling is now done in the chart model via ThemeProvider

  const params = useMemo(() => {
    const colors = sources?.map((source) => getProtocolColor(source)) ?? [sporeColors.accent1.val]
    return { data, colors, stale }
  }, [data, sporeColors, sources, stale])

  const lastEntry = data[data.length - 1]
  const isSingleLineChart = params.colors.length === 1

  return (
    <Chart Model={TVLChartModel} params={params} height={height} showDottedBackground={isSingleLineChart}>
      {(crosshairData: StackedLineData | undefined) => (
        <ChartHeader
          value={(crosshairData ?? lastEntry).values.reduce((v, sum) => (sum += v), 0)}
          time={crosshairData?.time}
          protocolData={sources?.map((source, index) => ({ protocol: source, value: crosshairData?.values[index] }))}
        />
      )}
    </Chart>
  )
}
