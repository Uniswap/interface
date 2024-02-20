import { QueryResult } from '@apollo/client'
import { t } from '@lingui/macro'
import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart, ChartModelParams } from 'components/Charts/ChartModel'
import { TooltipPrimitive } from 'components/Charts/Primitives/tooltip'
import { getCumulativeVolume } from 'components/Charts/VolumeChart/utils'
import { useHeaderDateFormatter } from 'components/Charts/hooks'
import { ChartHoverTooltipWrapper } from 'components/Pools/PoolDetails/ChartSection'
import { BIPS_BASE } from 'constants/misc'
import {
  Chain,
  Exact,
  HistoryDuration,
  TimestampedAmount,
  TokenHistoricalVolumesQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { TimePeriod, toHistoryDuration } from 'graphql/data/util'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { CustomVolumeChartModel, CustomVolumeChartModelParams } from './CustomVolumeChartModel'
import { SingleHistogramData } from './renderer'

interface VolumeChartModelParams extends ChartModelParams<SingleHistogramData>, CustomVolumeChartModelParams {
  TooltipBody?: React.FunctionComponent<{ data: SingleHistogramData }>
}

class VolumeChartModel extends CustomVolumeChartModel<SingleHistogramData> {
  private tooltipPrimitive: TooltipPrimitive<SingleHistogramData> | null = null

  constructor(chartDiv: HTMLDivElement, params: VolumeChartModelParams) {
    super(chartDiv, params)

    if (params.TooltipBody) {
      this.tooltipPrimitive = new TooltipPrimitive({ followMode: 'tracking', tooltipBody: params.TooltipBody })
      this.series.attachPrimitive(this.tooltipPrimitive)
    }
  }

  updateOptions(params: VolumeChartModelParams) {
    const volumeChartOptions = {
      autoSize: true,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.3,
          bottom: 0,
        },
      },
      handleScale: {
        axisPressedMouseMove: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    }

    super.updateOptions(params, volumeChartOptions)
  }
}

export function formatHistoryDuration(duration: HistoryDuration): string {
  switch (duration) {
    case HistoryDuration.FiveMinute:
      return t`Past five minutes`
    case HistoryDuration.Hour:
      return t`Past hour`
    case HistoryDuration.Day:
      return t`Past day`
    case HistoryDuration.Week:
      return t`Past week`
    case HistoryDuration.Month:
      return t`Past month`
    case HistoryDuration.Year:
      return t`Past year`
    case HistoryDuration.Max:
      return t`All time`
  }
}

function VolumeChartHeader({
  crosshairData,
  volumes,
  timePeriod,
}: {
  crosshairData?: SingleHistogramData
  volumes: SingleHistogramData[]
  timePeriod: TimePeriod
}) {
  const { formatFiatPrice } = useFormatter()
  const headerDateFormatter = useHeaderDateFormatter()

  const display = useMemo(() => {
    const displayValues = {
      volume: '-',
      time: '-',
    }
    const priceFormatter = (price?: number) =>
      formatFiatPrice({
        price,
        type: NumberType.ChartFiatValue,
      })
    if (crosshairData === undefined) {
      const cumulativeVolume = getCumulativeVolume(volumes)
      displayValues.volume = priceFormatter(cumulativeVolume)
      displayValues.time = formatHistoryDuration(toHistoryDuration(timePeriod))
    } else {
      displayValues.volume = priceFormatter(crosshairData.value)
      displayValues.time = headerDateFormatter(crosshairData.time)
    }
    return displayValues
  }, [crosshairData, formatFiatPrice, headerDateFormatter, timePeriod, volumes])

  return (
    <ChartHeader
      value={<ThemedText.HeadlineLarge color="inherit">{display.volume}</ThemedText.HeadlineLarge>}
      time={crosshairData?.time}
      timePlaceholder={formatHistoryDuration(toHistoryDuration(timePeriod))}
    />
  )
}

function FeesTooltipDisplay({
  data,
  feeTier,
  format: { formatFiatPrice },
}: {
  data: SingleHistogramData
  feeTier?: number
  format: ReturnType<typeof useFormatter>
}) {
  const fees = data.value * ((feeTier ?? 0) / BIPS_BASE / 100)

  return (
    <ChartHoverTooltipWrapper>
      <ThemedText.BodySmall>{t`Fees: ${formatFiatPrice({
        price: fees,
        type: NumberType.ChartFiatValue,
      })}`}</ThemedText.BodySmall>
    </ChartHoverTooltipWrapper>
  )
}

interface VolumeChartProps {
  height: number
  volumeQueryResult: QueryResult<
    TokenHistoricalVolumesQuery,
    Exact<{
      chain: Chain
      address?: string
      duration: HistoryDuration
    }>
  >
  feeTier?: number
  timePeriod: TimePeriod
  TooltipBody?: React.FunctionComponent<{ data: SingleHistogramData }>
}

export function VolumeChart({ height, volumeQueryResult, feeTier, timePeriod }: VolumeChartProps) {
  const theme = useTheme()
  const format = useFormatter()

  const { data: queryData } = volumeQueryResult
  const volumes: readonly TimestampedAmount[] | undefined = queryData?.token?.market?.historicalVolume

  const data: SingleHistogramData[] = useMemo(
    () =>
      volumes?.map((volumePoint) => {
        return { value: volumePoint.value, time: volumePoint.timestamp as UTCTimestamp }
      }) ?? [],
    [volumes]
  )

  const params = useMemo(
    () => ({
      data,
      colors: [theme.accent1],
      headerHeight: 75,
      TooltipBody:
        feeTier === undefined // i.e. if is token volume chart
          ? undefined
          : ({ data }: { data: SingleHistogramData }) => (
              <FeesTooltipDisplay data={data} feeTier={feeTier} format={format} />
            ),
    }),
    [data, theme.accent1, feeTier, format]
  )

  return (
    <Chart Model={VolumeChartModel} params={params} height={height}>
      {(crosshairData) => <VolumeChartHeader crosshairData={crosshairData} volumes={data} timePeriod={timePeriod} />}
    </Chart>
  )
}
