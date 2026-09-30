import type { Currency } from '@uniswap/sdk-core'
import { SynchronizedHeartbeatsConfigKey } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChart } from '~/components/Charts/PriceChart'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { TimePeriod, toHistoryDuration } from '~/data/util'
import { EXPLORE_CHART_HEIGHT_PX } from '~/features/Explore/constants'
import { AuctionDisplayPhase } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { useTokenPriceChartPanel } from '~/hooks/useTokenPriceChartPanel'
import { useIsSynchronizedHeartbeatEnabled } from '~/lib/hooks/useHeartbeatCoordinator'
import type { TDPChartQueryVariables } from '~/pages/TokenDetails/components/chart/TDPChartState'

interface TDPPriceChartPanelProps {
  variables: TDPChartQueryVariables
  priceChartType: PriceChartType
  displayPriceChartType: PriceChartType
  setDisableCandlestickUI: (disable: boolean) => void
  tokenColor?: string
  timePeriod: TimePeriod
  currency: Currency
  /** Present only for a confirmed Custom auction with no pool. */
  auctionOnlyPhase?: AuctionDisplayPhase
}

export function TDPPriceChartPanel({
  variables,
  priceChartType,
  displayPriceChartType,
  setDisableCandlestickUI,
  tokenColor,
  timePeriod,
  currency,
  auctionOnlyPhase,
}: TDPPriceChartPanelProps): JSX.Element {
  const { t } = useTranslation()
  // The heartbeat's price tick refetches these queries — a self-poll would double it.
  // `enabled` must match the `Boolean(derivedState.currency)` passed to useTDPHeartbeatCoordinator.
  const isSynchronizedHeartbeatsEnabled = useIsSynchronizedHeartbeatEnabled(
    SynchronizedHeartbeatsConfigKey.TdpPollIntervalSeconds,
    Boolean(currency),
  )
  const { priceQuery, pricePercentChange, showInvalidSkeleton, isError, stale } = useTokenPriceChartPanel({
    variables,
    priceChartType,
    setDisableCandlestickUI,
    timePeriod,
    currency,
    disablePricePolling: isSynchronizedHeartbeatsEnabled,
    keepPreviousData: false,
  })

  if (showInvalidSkeleton) {
    if (auctionOnlyPhase === AuctionDisplayPhase.Live && !priceQuery.loading) {
      return (
        <ChartSkeleton
          type={ChartType.PRICE}
          height={EXPLORE_CHART_HEIGHT_PX}
          errorTitle={t('tdp.auction.chart.priceDiscovery')}
          errorText={t('tdp.auction.chart.checkBack', { symbol: currency.symbol ?? t('tdp.symbolNotFound') })}
        />
      )
    }

    // An INVALID verdict covers both a failed query and a token with too little Uniswap volume to
    // plot. Only the former is a failure on our side, so only it keeps the error framing.
    const isNoData = !priceQuery.loading && !isError
    return (
      <ChartSkeleton
        type={ChartType.PRICE}
        height={EXPLORE_CHART_HEIGHT_PX}
        errorTitle={isNoData ? t('chart.noData.price.title') : t('chart.missingData')}
        errorText={
          priceQuery.loading ? undefined : isNoData ? t('chart.noData.tokens.description') : t('chart.error.tokens')
        }
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
