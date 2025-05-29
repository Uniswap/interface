import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart, ChartModelParams } from 'components/Charts/ChartModel'
import {
  CustomVolumeChartModel,
  CustomVolumeChartModelParams,
} from 'components/Charts/VolumeChart/CustomVolumeChartModel'
import { SingleHistogramData } from 'components/Charts/VolumeChart/renderer'
import { getCumulativeVolume } from 'components/Charts/VolumeChart/utils'
import { useHeaderDateFormatter } from 'components/Charts/hooks'
import { TimePeriod, toHistoryDuration } from 'graphql/data/util'
import { TFunction } from 'i18next'
import { useTheme } from 'lib/styled-components'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NumberType, useFormatter } from 'utils/formatNumbers'

interface VolumeChartModelParams extends ChartModelParams<SingleHistogramData>, CustomVolumeChartModelParams {
  TooltipBody?: React.FunctionComponent<{ data: SingleHistogramData }>
}

class VolumeChartModel extends CustomVolumeChartModel<SingleHistogramData> {
  constructor(chartDiv: HTMLDivElement, params: VolumeChartModelParams) {
    super(chartDiv, params)
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

// eslint-disable-next-line consistent-return
function formatHistoryDuration(t: TFunction, duration: HistoryDuration): string {
  switch (duration) {
    case HistoryDuration.FiveMinute:
      return t('common.pastFiveMinutes')
    case HistoryDuration.Hour:
      return t('common.pastHour')
    case HistoryDuration.Day:
      return t('common.pastDay')
    case HistoryDuration.Week:
      return t('common.pastWeek')
    case HistoryDuration.Month:
      return t('common.pastMonth')
    case HistoryDuration.Year:
      return t('common.pastYear')
    case HistoryDuration.Max:
      return t('common.allTime')
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
  const { t } = useTranslation()
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
      displayValues.time = formatHistoryDuration(t, toHistoryDuration(timePeriod))
    } else {
      displayValues.volume = priceFormatter(crosshairData.value)
      displayValues.time = headerDateFormatter(crosshairData.time)
    }
    return displayValues
  }, [crosshairData, formatFiatPrice, headerDateFormatter, t, timePeriod, volumes])

  return (
    <ChartHeader
      value={<ThemedText.HeadlineLarge color="inherit">{display.volume}</ThemedText.HeadlineLarge>}
      time={crosshairData?.time}
      timePlaceholder={formatHistoryDuration(t, toHistoryDuration(timePeriod))}
    />
  )
}

function FeesTooltipDisplay({ data, feeTier }: { data: SingleHistogramData; feeTier?: number }) {
  const { t } = useTranslation()
  const { formatFiatPrice } = useFormatter()
  const fees = data.value * ((feeTier ?? 0) / BIPS_BASE / 100)

  return (
    <>
      <ThemedText.BodySmall>
        {t(`token.chart.tooltip`, {
          amount: formatFiatPrice({
            price: fees,
            type: NumberType.ChartFiatValue,
          }),
        })}
      </ThemedText.BodySmall>
    </>
  )
}

interface VolumeChartProps {
  height: number
  data: SingleHistogramData[]
  feeTier?: number
  timePeriod: TimePeriod
  TooltipBody?: React.FunctionComponent<{ data: SingleHistogramData }>
  stale: boolean
}

export function VolumeChart({ height, data, feeTier, timePeriod, stale }: VolumeChartProps) {
  const theme = useTheme()

  const params = useMemo(
    () => ({ data, colors: [theme.accent1], headerHeight: 75, stale }),
    [data, stale, theme.accent1],
  )

  return (
    <Chart
      Model={VolumeChartModel}
      params={params}
      height={height}
      TooltipBody={
        feeTier === undefined // i.e. if is token volume chart
          ? undefined
          : ({ data }: { data: SingleHistogramData }) => <FeesTooltipDisplay data={data} feeTier={feeTier} />
      }
    >
      {(crosshairData) => <VolumeChartHeader crosshairData={crosshairData} volumes={data} timePeriod={timePeriod} />}
    </Chart>
  )
}
