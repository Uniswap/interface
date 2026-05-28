import { useTranslation } from 'react-i18next'
import { TimePeriod } from '~/appGraphql/data/util'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { ChartType, DataQuality } from '~/components/Charts/utils'
import { VolumeChart } from '~/components/Charts/VolumeChart'
import { EXPLORE_CHART_HEIGHT_PX } from '~/features/Explore/constants'
import { useTDPVolumeChartData, type TDPChartQueryVariables } from '~/pages/TokenDetails/components/chart/hooks'

interface TDPVolumeChartPanelProps {
  variables: TDPChartQueryVariables
  tokenColor?: string
  timePeriod: TimePeriod
}

export function TDPVolumeChartPanel({ variables, tokenColor, timePeriod }: TDPVolumeChartPanelProps): JSX.Element {
  const { t } = useTranslation()

  const volumeQuery = useTDPVolumeChartData(variables, false)

  if (volumeQuery.dataQuality === DataQuality.INVALID) {
    return (
      <ChartSkeleton
        type={ChartType.VOLUME}
        height={EXPLORE_CHART_HEIGHT_PX}
        errorText={volumeQuery.loading ? undefined : t('chart.error.tokens')}
      />
    )
  }

  const stale = volumeQuery.dataQuality === DataQuality.STALE

  return (
    <VolumeChart
      data={volumeQuery.entries}
      height={EXPLORE_CHART_HEIGHT_PX}
      timePeriod={timePeriod}
      stale={stale}
      overrideColor={tokenColor}
    />
  )
}
