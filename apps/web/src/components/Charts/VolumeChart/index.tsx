import { TimePeriod, toHistoryDuration } from 'appGraphql/data/util'
import { GraphQLApi } from '@universe/api'
import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart, ChartModelParams } from 'components/Charts/ChartModel'
import { useHeaderDateFormatter } from 'components/Charts/hooks/useHeaderDateFormatter'
import {
  CustomVolumeChartModel,
  CustomVolumeChartModelParams,
} from 'components/Charts/VolumeChart/CustomVolumeChartModel'
import { SingleHistogramData } from 'components/Charts/VolumeChart/renderer'
import { getCumulativeVolume } from 'components/Charts/VolumeChart/utils'
import { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { useSporeColors } from 'ui/src'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

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
function formatHistoryDuration(t: TFunction, duration: GraphQLApi.HistoryDuration): string {
  switch (duration) {
    case GraphQLApi.HistoryDuration.FiveMinute:
      return t('common.pastFiveMinutes')
    case GraphQLApi.HistoryDuration.Hour:
      return t('common.pastHour')
    case GraphQLApi.HistoryDuration.Day:
      return t('common.pastDay')
    case GraphQLApi.HistoryDuration.Week:
      return t('common.pastWeek')
    case GraphQLApi.HistoryDuration.Month:
      return t('common.pastMonth')
    case GraphQLApi.HistoryDuration.Year:
      return t('common.pastYear')
    case GraphQLApi.HistoryDuration.Max:
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
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const headerDateFormatter = useHeaderDateFormatter()

  const display = useMemo(() => {
    const displayValues = {
      volume: '-',
      time: '-',
    }
    const priceFormatter = (price?: number) => convertFiatAmountFormatted(price, NumberType.FiatTokenStats)
    if (crosshairData === undefined) {
      const cumulativeVolume = getCumulativeVolume(volumes)
      displayValues.volume = priceFormatter(cumulativeVolume)
      displayValues.time = formatHistoryDuration(t, toHistoryDuration(timePeriod))
    } else {
      displayValues.volume = priceFormatter(crosshairData.value)
      displayValues.time = headerDateFormatter(crosshairData.time)
    }
    return displayValues
  }, [crosshairData, convertFiatAmountFormatted, headerDateFormatter, t, timePeriod, volumes])

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
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const fees = data.value * ((feeTier ?? 0) / BIPS_BASE / 100)

  return (
    <>
      <ThemedText.BodySmall>
        {t(`token.chart.tooltip`, {
          amount: convertFiatAmountFormatted(fees, NumberType.FiatTokenStats),
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
  overrideColor?: string
}

export function VolumeChart({ height, data, feeTier, timePeriod, stale, overrideColor }: VolumeChartProps) {
  const colors = useSporeColors()

  const params = useMemo(
    () => ({ data, chartColors: [colors.accent1.val], headerHeight: 75, stale }),
    [data, stale, colors],
  )

  return (
    <Chart
      Model={VolumeChartModel}
      params={params}
      height={height}
      showDottedBackground={true}
      overrideColor={overrideColor}
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
