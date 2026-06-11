import type { Currency } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { TimePeriod, toHistoryDuration } from '~/appGraphql/data/util'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChart } from '~/components/Charts/PriceChart'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { EXPLORE_CHART_HEIGHT_PX } from '~/features/Explore/constants'
import { useTokenPriceChartPanel } from '~/hooks/useTokenPriceChartPanel'
import type { TDPChartQueryVariables } from '~/pages/TokenDetails/components/chart/hooks'

interface TDPPriceChartPanelProps {
  variables: TDPChartQueryVariables
  priceChartType: PriceChartType
  displayPriceChartType: PriceChartType
  setDisableCandlestickUI: (disable: boolean) => void
  tokenColor?: string
  timePeriod: TimePeriod
  currency: Currency
}

export function TDPPriceChartPanel({
  variables,
  priceChartType,
  displayPriceChartType,
  setDisableCandlestickUI,
  tokenColor,
  timePeriod,
  currency,
}: TDPPriceChartPanelProps): JSX.Element {
  const { t } = useTranslation()
  const { priceQuery, pricePercentChange, showInvalidSkeleton, stale } = useTokenPriceChartPanel({
    variables,
    priceChartType,
    setDisableCandlestickUI,
    timePeriod,
    currency,
  })

  if (showInvalidSkeleton) {
    return (
      <ChartSkeleton
        type={ChartType.PRICE}
        height={EXPLORE_CHART_HEIGHT_PX}
        errorText={priceQuery.loading ? undefined : t('chart.error.tokens')}
      />
    )
  }

  return (
    <PriceChart
      data={priceQuery.entries}
      height={EXPLORE_CHART_HEIGHT_PX}
      type={displayPriceChartType}
      stale={stale}
      timePeriod={toHistoryDuration(timePeriod)}
      pricePercentChange={pricePercentChange}
      overrideColor={tokenColor}
    />
  )
}
