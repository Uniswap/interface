import { useTranslation } from 'react-i18next'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { ChartType, DataQuality } from '~/components/Charts/utils'
import { VolumeChart } from '~/components/Charts/VolumeChart'
import { TimePeriod } from '~/data/util'
import { EXPLORE_CHART_HEIGHT_PX } from '~/features/Explore/constants'
import { useTDPVolumeChartData } from '~/pages/TokenDetails/components/chart/hooks/useTDPVolumeChartData'
import type { TDPChartQueryVariables } from '~/pages/TokenDetails/components/chart/TDPChartState'

interface TDPVolumeChartPanelProps {
  variables: TDPChartQueryVariables
  tokenColor?: string
  timePeriod: TimePeriod
}

export function TDPVolumeChartPanel({ variables, tokenColor, timePeriod }: TDPVolumeChartPanelProps): JSX.Element {
  const { t } = useTranslation()

  const volumeQuery = useTDPVolumeChartData({ variables, skip: false })

  if (volumeQuery.dataQuality === DataQuality.INVALID) {
    // An INVALID verdict covers both a failed query and a token with too little Uniswap volume to
    // plot. Only the former is a failure on our side, so only it keeps the error framing.
    const isNoData = !volumeQuery.loading && !volumeQuery.isError
    return (
      <ChartSkeleton
        type={ChartType.VOLUME}
        height={EXPLORE_CHART_HEIGHT_PX}
        errorTitle={isNoData ? t('chart.noData.volume.title') : t('chart.missingData')}
        errorText={
          volumeQuery.loading ? undefined : isNoData ? t('chart.noData.tokens.description') : t('chart.error.tokens')
        }
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
