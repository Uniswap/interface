import type { Currency } from '@uniswap/sdk-core'
import { SynchronizedHeartbeatsConfigKey } from '@universe/gating'
import { useEffect } from 'react'
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
  isStablecoin?: boolean
  /** Present only for a confirmed Custom auction with no pool. */
  auctionOnlyPhase?: AuctionDisplayPhase
  /** True while the token could still resolve to auction-only, so neither empty-chart copy is known to be right yet. */
  isAuctionOnlyPending?: boolean
  onPriceDiscoveryViewed?: () => void
}

export function TDPPriceChartPanel({
  variables,
  priceChartType,
  displayPriceChartType,
  setDisableCandlestickUI,
  tokenColor,
  timePeriod,
  currency,
  isStablecoin,
  auctionOnlyPhase,
  isAuctionOnlyPending,
  onPriceDiscoveryViewed,
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
  // Before and during the auction there is no price to plot, so the empty chart explains the wait
  // instead of reporting missing data. A token that already has history keeps its real chart, and a
  // failed query keeps the error framing so an outage is not mistaken for price discovery.
  const isPriceDiscoveryPhase =
    auctionOnlyPhase === AuctionDisplayPhase.Upcoming || auctionOnlyPhase === AuctionDisplayPhase.Live
  const showPriceDiscovery = showInvalidSkeleton && isPriceDiscoveryPhase && !priceQuery.loading && !isError
  // The price query settles before the auction lookup, its pool, and the chain head do, so naming the
  // chart empty on its own would print the no-data copy and then swap it for price discovery a moment
  // later. Until the auction-only question is answered, hold the same bare skeleton a pending price
  // query shows rather than narrate a state that is still in flight. A failed query can never become
  // price discovery, so it reports the error straight away.
  const isResolving = priceQuery.loading || (Boolean(isAuctionOnlyPending) && !isError)

  useEffect(() => {
    if (showPriceDiscovery) {
      onPriceDiscoveryViewed?.()
    }
  }, [onPriceDiscoveryViewed, showPriceDiscovery])

  if (showInvalidSkeleton) {
    if (showPriceDiscovery) {
      return (
        <ChartSkeleton
          type={ChartType.PRICE}
          height={EXPLORE_CHART_HEIGHT_PX}
          errorTitle={
            auctionOnlyPhase === AuctionDisplayPhase.Live
              ? t('tdp.auction.chart.priceDiscovery')
              : t('tdp.auction.chart.waitingForPriceDiscovery')
          }
          errorText={t('tdp.auction.chart.checkBack', { symbol: currency.symbol ?? t('tdp.symbolNotFound') })}
          errorBackgroundColor="$surface2"
          errorBorderColor="transparent"
          hideErrorIcon
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
        errorText={isResolving ? undefined : isNoData ? t('chart.noData.tokens.description') : t('chart.error.tokens')}
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
      isStablecoin={isStablecoin}
    />
  )
}
