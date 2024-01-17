import { Chart, ChartModel, ChartModelParams } from 'components/Charts/ChartModel'
import { useHeaderDateFormatter } from 'components/Charts/hooks'
import { ChartContainer } from 'components/Charts/shared'
import { HARDCODED_TVL_DATA } from 'components/Charts/StackedLineChart/mockData'
import { StackedAreaSeriesOptions } from 'components/Charts/StackedLineChart/stacked-area-series/options'
import { StackedAreaSeries } from 'components/Charts/StackedLineChart/stacked-area-series/stacked-area-series'
import { ProtocolDetail, ProtocolLegend } from 'components/Charts/StackedVolumeChart'
import { RowBetween } from 'components/Row'
import { PriceSource } from 'graphql/data/__generated__/types-and-hooks'
import { getProtocolColor } from 'graphql/data/util'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { CustomStyleOptions, DeepPartial, ISeriesApi, Logical, UTCTimestamp, WhitespaceData } from 'lightweight-charts'
import React, { useMemo, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components/text'
import { textFadeIn } from 'theme/styles'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export interface StackedLineData extends WhitespaceData<UTCTimestamp> {
  values: number[]
}

interface TVLChartParams extends ChartModelParams<StackedLineData> {
  colors: string[]
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
      if (param?.logical !== this.hoveredLogicalIndex) {
        this.hoveredLogicalIndex = param?.logical
        this.series.applyOptions({
          hoveredLogicalIndex: this.hoveredLogicalIndex ?? (-1 as Logical), // -1 is used because series will use prev value if undefined is passed
        } as DeepPartial<StackedAreaSeriesOptions>)
      }
    })
  }

  updateOptions(params: TVLChartParams) {
    super.updateOptions(params, {
      rightPriceScale: {
        visible: params.colors.length == 1, // Hide pricescale on multi-line charts
        borderVisible: false,
        scaleMargins: {
          top: 0.25,
          bottom: 0,
        },
        autoScale: true,
      },
    })
    const { data, colors } = params

    // Handles changes in data, e.g. time period selection
    if (this.data !== data) {
      this.data = data
      this.series.setData(data)
      this.fitContent()
    }

    this.series.applyOptions({
      priceLineVisible: false,
      lastValueVisible: false,
      colors,
      lineWidth: 2.5,
    } as DeepPartial<StackedAreaSeriesOptions>)
  }
}

const Header = styled(RowBetween)`
  ${textFadeIn};
  position: absolute;
  width: 100%;
  gap: 8px;
`
const HeaderDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 14px;
  text-align: left;
  pointer-events: none;
`

interface ChartHeaderProps {
  data: StackedLineData[]
  sources?: PriceSource[]
  crosshairData?: StackedLineData
}

function ChartHeader({ data, crosshairData, sources }: ChartHeaderProps) {
  const { formatFiatPrice } = useFormatter()
  const headerDateFormatter = useHeaderDateFormatter()

  const lastEntry = data[data.length - 1]

  return (
    <Header>
      <RowBetween align="flex-start">
        <HeaderDisplay>
          <ThemedText.HeadlineLarge>
            {formatFiatPrice({
              price: (crosshairData ?? lastEntry)?.values.reduce((v, sum) => (sum += v), 0),
              type: NumberType.FiatTokenStatChartHeader,
            })}
          </ThemedText.HeadlineLarge>
          {crosshairData && (
            <ThemedText.Caption color="neutral2">{headerDateFormatter(crosshairData.time)}</ThemedText.Caption>
          )}
        </HeaderDisplay>
        <ProtocolLegend>
          {sources
            ?.map((protocol, index) => (
              <ProtocolDetail value={crosshairData?.values[index]} protocol={protocol} key={protocol + '_blip'} />
            ))
            .reverse()}
        </ProtocolLegend>
      </RowBetween>
    </Header>
  )
}

interface StackedLineChartProps {
  height: number
  data?: StackedLineData[]
  sources?: PriceSource[]
}

export function StackedLineChart({ height, data = HARDCODED_TVL_DATA, sources }: StackedLineChartProps) {
  const locale = useActiveLocale()
  const theme = useTheme()
  const format = useFormatter()
  const [crosshairData, setCrosshairData] = useState<StackedLineData>()

  const params: TVLChartParams = useMemo(() => {
    const colors = sources?.map((source) => getProtocolColor(source, theme)) ?? [theme.accent1]
    return {
      data,
      locale,
      theme,
      format,
      onCrosshairMove: setCrosshairData,
      colors,
    }
  }, [data, locale, theme, format, sources])

  return (
    <ChartContainer $height={height}>
      <ChartHeader data={data} sources={sources} crosshairData={crosshairData} />
      <Chart Model={TVLChartModel} params={params} height={height} />
    </ChartContainer>
  )
}
