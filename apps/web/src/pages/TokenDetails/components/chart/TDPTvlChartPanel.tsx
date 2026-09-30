import { useTranslation } from 'react-i18next'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { LineChart } from '~/components/Charts/StackedLineChart'
import { ChartType, DataQuality } from '~/components/Charts/utils'
import { EXPLORE_CHART_HEIGHT_PX } from '~/features/Explore/constants'
import { useTDPTVLChartData } from '~/pages/TokenDetails/components/chart/hooks/useTDPTVLChartData'
import type { TDPChartQueryVariables } from '~/pages/TokenDetails/components/chart/TDPChartState'

interface TDPTvlChartPanelProps {
  variables: TDPChartQueryVariables
  tokenColor?: string
}

export function TDPTvlChartPanel({ variables, tokenColor }: TDPTvlChartPanelProps): JSX.Element {
  const { t } = useTranslation()

  const tvlQuery = useTDPTVLChartData({ variables, skip: false })

  if (tvlQuery.dataQuality === DataQuality.INVALID) {
    // An INVALID verdict covers both a failed query and a token with too little Uniswap volume to
    // plot. Only the former is a failure on our side, so only it keeps the error framing.
    const isNoData = !tvlQuery.loading && !tvlQuery.isError
    return (
      <ChartSkeleton
        type={ChartType.TVL}
        height={EXPLORE_CHART_HEIGHT_PX}
        errorTitle={isNoData ? t('chart.noData.tvl.title') : t('chart.missingData')}
        errorText={
          tvlQuery.loading ? undefined : isNoData ? t('chart.noData.tokens.description') : t('chart.error.tokens')
        }
      />
    )
  }

  const stale = tvlQuery.dataQuality === DataQuality.STALE

  return <LineChart data={tvlQuery.entries} height={EXPLORE_CHART_HEIGHT_PX} stale={stale} overrideColor={tokenColor} />
}
