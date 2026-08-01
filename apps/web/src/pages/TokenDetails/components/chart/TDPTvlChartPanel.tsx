import { useTranslation } from 'react-i18next'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { LineChart } from '~/components/Charts/StackedLineChart'
import { ChartType, DataQuality } from '~/components/Charts/utils'
import { EXPLORE_CHART_HEIGHT_PX } from '~/features/Explore/constants'
import { useTDPTVLChartData, type TDPChartQueryVariables } from '~/pages/TokenDetails/components/chart/hooks'

interface TDPTvlChartPanelProps {
  variables: TDPChartQueryVariables
  tokenColor?: string
}

export function TDPTvlChartPanel({ variables, tokenColor }: TDPTvlChartPanelProps): JSX.Element {
  const { t } = useTranslation()

  const tvlQuery = useTDPTVLChartData({ variables, skip: false })

  if (tvlQuery.dataQuality === DataQuality.INVALID) {
    return (
      <ChartSkeleton
        type={ChartType.TVL}
        height={EXPLORE_CHART_HEIGHT_PX}
        errorText={tvlQuery.loading ? undefined : t('chart.error.tokens')}
      />
    )
  }

  const stale = tvlQuery.dataQuality === DataQuality.STALE

  return <LineChart data={tvlQuery.entries} height={EXPLORE_CHART_HEIGHT_PX} stale={stale} overrideColor={tokenColor} />
}
