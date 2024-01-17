import { t } from '@lingui/macro'
import { Chart, ChartModel, ChartModelParams } from 'components/Charts/ChartModel'
import { useHeaderDateFormatter } from 'components/Charts/hooks'
import { ChartContainer } from 'components/Charts/shared'
import Column from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import { PriceSource } from 'graphql/data/__generated__/types-and-hooks'
import { getProtocolColor, getProtocolName, TimePeriod } from 'graphql/data/util'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { ISeriesApi } from 'lightweight-charts'
import { useMemo, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { colors } from 'theme/colors'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { CrosshairHighlightPrimitive } from '../VolumeChart/CrosshairHighlightPrimitive'
import { StackedBarsData } from './renderer'
import { getCumulativeSum, StackedBarsSeries } from './stacked-bar-series'

const ChartHeader = styled(RowBetween)`
  position: absolute;
  padding-bottom: 14px;
  text-align: left;
  pointer-events: none;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding: 0px;
    gap: 4px;
  }
`
export const ProtocolLegend = styled(Column)`
  padding: 4px 12px;
  gap: 12px;
  text-align: left;
  pointer-events: none;
`
const ProtocolBlip = styled.div<{ color: string }>`
  background-color: ${({ color }) => color};
  border-radius: 4px;
  width: 12px;
  height: 12px;
`

type StackedVolumeChartModelParams = ChartModelParams<StackedBarsData> & { colors: [string, string] }

class StackedVolumeChartModel extends ChartModel<StackedBarsData> {
  protected series: ISeriesApi<'Custom'>
  private highlightBarPrimitive: CrosshairHighlightPrimitive

  constructor(chartDiv: HTMLDivElement, params: StackedVolumeChartModelParams) {
    super(chartDiv, params)

    this.series = this.api.addCustomSeries(new StackedBarsSeries({ colors: params.colors }))

    this.series.setData(this.data)

    // Add crosshair highlight bar
    this.highlightBarPrimitive = new CrosshairHighlightPrimitive({
      color: params.theme.surface3,
      crosshairYPosition: 85,
    })
    this.series.attachPrimitive(this.highlightBarPrimitive)

    this.updateOptions(params)
    this.fitContent()
  }

  updateOptions(params: StackedVolumeChartModelParams) {
    const stackedVolumeChartOptions = {
      localization: {
        locale: params.locale,
      },
      rightPriceScale: {
        visible: false,
      },
      handleScale: {
        axisPressedMouseMove: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
      crosshair: {
        horzLine: {
          visible: false,
          labelVisible: false,
        },
        vertLine: {
          visible: false,
          labelVisible: false,
        },
      },
    }

    super.updateOptions(params, stackedVolumeChartOptions)
    const { data, theme } = params

    // Handles changes in data, e.g. time period selection
    if (this.data !== data) {
      this.data = data
      this.series.setData(data)
      this.fitContent()
    }

    this.series.applyOptions({
      priceFormat: {
        type: 'volume',
      },
      priceLineVisible: false,
      lastValueVisible: false,
    })

    this.series.priceScale().applyOptions({
      scaleMargins: {
        top: 0.3,
        bottom: 0,
      },
    })

    this.highlightBarPrimitive.applyOptions({ color: theme.surface3 })
  }
}

const TIME_PERIOD_DESCRIPTOR: { [key in TimePeriod]: string } = {
  [TimePeriod.HOUR]: t`Past hour`,
  [TimePeriod.DAY]: t`Past day`,
  [TimePeriod.WEEK]: t`Past week`,
  [TimePeriod.MONTH]: t`Past month`,
  [TimePeriod.YEAR]: t`Past year`,
}

export function ProtocolDetail({ protocol, value }: { protocol: PriceSource; value?: number }) {
  const { formatFiatPrice } = useFormatter()
  const theme = useTheme()

  return (
    <Row gap="6px" justify="flex-end">
      <ThemedText.Caption>
        {value
          ? formatFiatPrice({ price: value, type: NumberType.FiatTokenStatChartHeader })
          : getProtocolName(protocol)}
      </ThemedText.Caption>
      <ProtocolBlip color={getProtocolColor(protocol, theme)} />
    </Row>
  )
}

export function getCumulativeVolume(data: StackedBarsData[]) {
  return data.reduce((sum, curr) => (sum += getCumulativeSum(curr)), 0)
}

function StackedVolumeChartHeader({
  data,
  crosshairData,
  timePeriod,
}: {
  data: StackedBarsData[]
  crosshairData?: StackedBarsData
  timePeriod: TimePeriod
}) {
  const { formatFiatPrice } = useFormatter()
  const headerDateFormatter = useHeaderDateFormatter()

  const { sum, time } = useMemo(() => {
    if (crosshairData) {
      const sum = getCumulativeSum(crosshairData)
      return { sum, time: headerDateFormatter(crosshairData.time) }
    }

    const sum = getCumulativeVolume(data)
    const time = TIME_PERIOD_DESCRIPTOR[timePeriod]

    return { sum, time }
  }, [data, crosshairData, timePeriod, headerDateFormatter])

  return (
    <ChartHeader>
      <Column>
        <ThemedText.HeadlineLarge>
          {formatFiatPrice({ price: sum, type: NumberType.FiatTokenStatChartHeader })}
        </ThemedText.HeadlineLarge>
        <ThemedText.Caption color="neutral2">{time}</ThemedText.Caption>
      </Column>
      <ProtocolLegend>
        <ProtocolDetail protocol={PriceSource.SubgraphV3} value={crosshairData?.values.v3} />
        <ProtocolDetail protocol={PriceSource.SubgraphV2} value={crosshairData?.values.v2} />
      </ProtocolLegend>
    </ChartHeader>
  )
}

export function StackedVolumeChart({
  height,
  data,
  timePeriod,
}: {
  height: number
  data: StackedBarsData[]
  timePeriod: TimePeriod
}) {
  const locale = useActiveLocale()
  const theme = useTheme()
  const format = useFormatter()

  const [crosshairData, setCrosshairData] = useState<StackedBarsData>()

  const params: StackedVolumeChartModelParams = useMemo(() => {
    return {
      data,
      locale,
      theme,
      colors: [theme.accent1, colors.blue400],
      format,
      onCrosshairMove: setCrosshairData,
    }
  }, [data, locale, theme, format])

  return (
    <ChartContainer $height={height}>
      <StackedVolumeChartHeader data={data} crosshairData={crosshairData} timePeriod={timePeriod} />
      <Chart Model={StackedVolumeChartModel} params={params} height={height} />
    </ChartContainer>
  )
}
