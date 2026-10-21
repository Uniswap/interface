import { normalizeTokenAddressForCache } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { getIsStablecoin } from 'uniswap/src/components/charts/utils'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ChartType } from '~/components/Charts/utils'
import { toHistoryDuration } from '~/data/util'
import { shouldShowAuctionOnlyLayout } from '~/features/Toucan/Auction/utils/auctionDisplayVisibility'
import { AuctionDisplayPhase } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { ChartControls } from '~/pages/TokenDetails/components/chart/ChartControls'
import { getDisplayPriceChartType } from '~/pages/TokenDetails/components/chart/TDPChartState'
import {
  TDPChartStateProvider,
  useTDPChartStateContext,
} from '~/pages/TokenDetails/components/chart/TDPChartStateContext'
import { TDPPriceChartPanel } from '~/pages/TokenDetails/components/chart/TDPPriceChartPanel'
import { TDPTvlChartPanel } from '~/pages/TokenDetails/components/chart/TDPTvlChartPanel'
import { TDPVolumeChartPanel } from '~/pages/TokenDetails/components/chart/TDPVolumeChartPanel'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { getTDPChartGraphqlTarget } from '~/pages/TokenDetails/hooks/getTDPChartGraphqlTarget'
import { useTDPMultichainAggregate } from '~/pages/TokenDetails/hooks/useTDPMultichainAggregate'
import { useTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { getTokenDetailsProvenanceProperties } from '~/pages/TokenDetails/utils/tokenDetailsProvenanceAnalytics'

function ChartSectionBody(): JSX.Element {
  const { tokenColor, currency, multichainToken, pathGraphqlChain, pathTokenDbAddress, selectedMultichainChainId } =
    useTDPStore((s) => ({
      tokenColor: s.tokenColor,
      currency: s.currency!,
      multichainToken: s.multichainToken,
      pathGraphqlChain: s.currencyChain,
      pathTokenDbAddress: s.pathTokenDbAddress,
      selectedMultichainChainId: s.selectedMultichainChainId,
    }))

  const { isMultichainAggregateView } = useTDPMultichainAggregate()
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const auctionDisplay = useTokenDetailsAuctionDisplay()
  const isAuctionOnly = shouldShowAuctionOnlyLayout(auctionDisplay)
  // The phases the price panel renders its price-discovery empty state for: no pool yet, so every chart
  // type and range is empty and the controls have nothing to switch between.
  const isPriceDiscovery =
    isAuctionOnly &&
    (auctionDisplay.phase === AuctionDisplayPhase.Upcoming || auctionDisplay.phase === AuctionDisplayPhase.Live)

  const { chain: tokenChain, address: tokenDBAddress } = useMemo(
    () =>
      getTDPChartGraphqlTarget({
        selectedMultichainChainId,
        multichainToken,
        pathGraphqlChain,
        pathTokenDbAddress,
      }),
    [pathGraphqlChain, pathTokenDbAddress, selectedMultichainChainId, multichainToken],
  )

  const { chartType, timePeriod, priceChartType, disableCandlestickUI, setDisableCandlestickUI } =
    useTDPChartStateContext()

  const variables = useMemo(
    () => ({
      address: tokenDBAddress,
      chain: tokenChain,
      duration: toHistoryDuration(timePeriod),
      multichain: isMultichainAggregateView,
    }),
    [isMultichainAggregateView, timePeriod, tokenChain, tokenDBAddress],
  )

  const displayPriceChartType = getDisplayPriceChartType(priceChartType, disableCandlestickUI)
  // The type toggle is hidden during price discovery, so a Volume or TVL selection made while the
  // auction lookup was still out would otherwise strand the user on an empty panel with no way back.
  const displayedChartType = isPriceDiscovery ? ChartType.PRICE : chartType
  const visitKey = `${tokenChain}:${normalizeTokenAddressForCache(tokenDBAddress ?? null)}:${normalizeTokenAddressForCache(auctionDisplay.auction?.address ?? null)}`
  const emptyStateImpression = useRef({ visitKey, sent: false })

  useEffect(() => {
    if (emptyStateImpression.current.visitKey !== visitKey) {
      emptyStateImpression.current = { visitKey, sent: false }
    }
  }, [visitKey])

  const onPriceDiscoveryViewed = useCallback(() => {
    // The panel can report before this parent's effect after a token/auction change.
    if (emptyStateImpression.current.visitKey !== visitKey) {
      emptyStateImpression.current = { visitKey, sent: false }
    }
    const properties = getTokenDetailsProvenanceProperties(auctionDisplay, { entry_point: 'chart_empty_state' })
    if (properties && !emptyStateImpression.current.sent) {
      emptyStateImpression.current.sent = true
      sendAnalyticsEvent(AuctionEventName.ChartEmptyStateViewed, properties)
    }
  }, [auctionDisplay, visitKey])

  return (
    <Flex data-cy={`tdp-${displayedChartType}-chart-container`} testID={`tdp-${displayedChartType}-chart-container`}>
      {displayedChartType === ChartType.PRICE && (
        <TDPPriceChartPanel
          variables={variables}
          priceChartType={priceChartType}
          displayPriceChartType={displayPriceChartType}
          setDisableCandlestickUI={setDisableCandlestickUI}
          tokenColor={tokenColor}
          timePeriod={timePeriod}
          currency={currency}
          isStablecoin={getIsStablecoin({ tokenCategoriesEnabled, categoryIds: multichainToken?.categoryIds })}
          auctionOnlyPhase={isAuctionOnly ? auctionDisplay.phase : undefined}
          isAuctionOnlyPending={auctionDisplay.isAuctionOnlyPending}
          onPriceDiscoveryViewed={onPriceDiscoveryViewed}
        />
      )}
      {displayedChartType === ChartType.VOLUME && (
        <TDPVolumeChartPanel variables={variables} tokenColor={tokenColor} timePeriod={timePeriod} />
      )}
      {displayedChartType === ChartType.TVL && <TDPTvlChartPanel variables={variables} tokenColor={tokenColor} />}
      <ChartControls variables={variables} isPriceDiscovery={isPriceDiscovery} />
    </Flex>
  )
}

export function ChartSection(): JSX.Element {
  return (
    <TDPChartStateProvider>
      <ChartSectionBody />
    </TDPChartStateProvider>
  )
}
