import type { Currency } from '@uniswap/sdk-core'
import { SynchronizedHeartbeatsConfigKey } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChart } from '~/components/Charts/PriceChart'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { TimePeriod, toHistoryDuration } from '~/data/util'
import { EXPLORE_CHART_HEIGHT_PX } from '~/features/Explore/constants'
import { useTokenPriceChartPanel } from '~/hooks/useTokenPriceChartPanel'
import { useIsSynchronizedHeartbeatEnabled } from '~/lib/hooks/useHeartbeatCoordinator'
import type { TDPChartQueryVariables } from '~/pages/TokenDetails/components/chart/hooks'
import { useTDPPreferProjectMarketData } from '~/pages/TokenDetails/hooks/useTDPPreferProjectMarketData'

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
  const preferProjectMarketData = useTDPPreferProjectMarketData()
  // The heartbeat's price tick refetches these queries — a self-poll would double it.
  // `enabled` must match the `Boolean(derivedState.currency)` passed to useTDPHeartbeatCoordinator.
  const isSynchronizedHeartbeatsEnabled = useIsSynchronizedHeartbeatEnabled(
    SynchronizedHeartbeatsConfigKey.TdpPollIntervalSeconds,
    Boolean(currency),
  )
  const { priceQuery, pricePercentChange, showInvalidSkeleton, stale } = useTokenPriceChartPanel({
    variables,
    priceChartType,
    setDisableCandlestickUI,
    timePeriod,
    currency,
    preferProjectMarketData,
    disablePricePolling: isSynchronizedHeartbeatsEnabled,
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
