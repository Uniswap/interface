import { useQuery } from '@tanstack/react-query'
import { HistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { areEvmAddressesEqual, normalizeTokenAddressForCache } from '@universe/chains'
import { Flex, Shimmer, Text } from '@universe/mycelium'
import { opacifyRaw, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  getGetTokenHistoryPriceQueryOptions,
  getGetTokenMarketsQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { AuctionEventName, ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import useResizeObserver from 'use-resize-observer'
import { SparklineChart } from '~/components/Charts/SparklineChart'
import { useAuctionTradingTokenInfo } from '~/features/Toucan/Auction/hooks/useAuctionTradingTokenInfo'
import { useNavigateToAuctionTokenDetails } from '~/features/Toucan/Auction/hooks/useNavigateToAuctionTokenDetails'
import { useNowTradingCardVisibility } from '~/features/Toucan/Auction/hooks/useNowTradingCardVisibility'
import { NowTradingCardStats } from '~/features/Toucan/Auction/NowTradingCardStats'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'

const SPARKLINE_HEIGHT = 111
const SPARKLINE_KEY = 'auction-token'

export function NowTradingCard(): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { ref: chartRef, width: chartWidth } = useResizeObserver<HTMLElement>()
  const { auctionDetails, tokenColor } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    tokenColor: state.tokenColor,
  }))
  const { isVisible, mayBecomeVisible } = useNowTradingCardVisibility()
  const { prefetchTokenDetails, navigateToTokenDetails, analyticsProperties } = useNavigateToAuctionTokenDetails({
    enabled: isVisible,
    entryPoint: 'auction_now_trading_card',
  })
  const tradingToken = useAuctionTradingTokenInfo({ enabled: isVisible })
  const tokenIdentifier =
    auctionDetails && tradingToken.address
      ? { chainId: auctionDetails.chainId, address: normalizeTokenAddressForCache(tradingToken.address) }
      : undefined
  const {
    data: marketData,
    isLoading: marketLoading,
    isFetched: marketFetched,
  } = useQuery({
    ...getGetTokenMarketsQueryOptions({
      params: tokenIdentifier ? { tokens: [tokenIdentifier], duration: HistoryDuration.DAY } : undefined,
      enabled: isVisible,
    }),
    placeholderData: undefined,
    refetchInterval: PollingInterval.KindaFast,
  })
  const {
    data: priceHistory,
    isLoading: historyLoading,
    isFetched: historyFetched,
  } = useQuery({
    ...getGetTokenHistoryPriceQueryOptions({
      params: tokenIdentifier
        ? {
            target: { case: 'singleChain', value: tokenIdentifier },
            duration: HistoryDuration.DAY,
          }
        : undefined,
      enabled: isVisible,
    }),
    placeholderData: undefined,
    refetchInterval: PollingInterval.KindaFast,
  })
  const stats = marketData?.markets.find(
    (market) =>
      tokenIdentifier &&
      market.chainId === tokenIdentifier.chainId &&
      areEvmAddressesEqual(market.address, tokenIdentifier.address),
  )?.stats

  const sparklinePoints = useMemo(
    () => priceHistory?.points.map((point) => ({ timestamp: Number(point.timestamp), value: point.priceUsd })) ?? [],
    [priceHistory?.points],
  )
  const sparklineMap = useMemo(() => ({ [SPARKLINE_KEY]: sparklinePoints }), [sparklinePoints])

  if (!mayBecomeVisible || !auctionDetails) {
    return null
  }

  const symbol = tradingToken.symbol ?? t('common.token')
  const accentColor = tokenColor ?? colors.accent1.val

  // Reveal the content when the card's own gates and its queries settle; a newly available chart
  // measures independently.
  const initialQueriesLoading =
    !isVisible ||
    !tradingToken.address ||
    tradingToken.loading ||
    (marketLoading && !marketFetched) ||
    (historyLoading && !historyFetched)
  const hasChart = sparklinePoints.length > 1
  const chartIsMeasured = chartWidth !== undefined && chartWidth > 0

  return (
    <Flex
      testID={TestID.ToucanNowTradingCard}
      aria-busy={initialQueriesLoading}
      onMouseEnter={prefetchTokenDetails}
      onFocus={prefetchTokenDetails}
      gap="$spacing16"
      p="$spacing16"
      borderRadius="$rounded24"
      borderWidth="$spacing1"
      borderColor="$surface3"
      backgroundColor="$surface1"
      style={
        initialQueriesLoading
          ? undefined
          : {
              borderColor: opacifyRaw(8, accentColor),
              backgroundClip: 'padding-box',
              backgroundImage: `linear-gradient(0deg, ${opacifyRaw(18, accentColor)} 0%, ${opacifyRaw(0, accentColor)} 100%)`,
            }
      }
    >
      {!initialQueriesLoading && analyticsProperties && (
        <Trace
          key={auctionDetails.address}
          logImpression
          eventOnTrigger={AuctionEventName.AuctionBannerViewed}
          properties={analyticsProperties}
        />
      )}
      {initialQueriesLoading ? (
        <Shimmer>
          <Flex row alignItems="center" gap="$spacing12">
            <Flex width={48} height={48} borderRadius="$roundedFull" backgroundColor="$surface3" />
            <Flex flex={1} gap="$spacing4">
              <Flex height={24} width="80%" borderRadius="$rounded4" backgroundColor="$surface3" />
              <Flex height={16} width="90%" borderRadius="$rounded4" backgroundColor="$surface3" />
            </Flex>
          </Flex>
        </Shimmer>
      ) : (
        <Flex row alignItems="center" gap="$spacing12">
          <TokenLogo
            url={tradingToken.logoUrl}
            chainId={auctionDetails.chainId}
            symbol={symbol}
            size={48}
            hideNetworkLogo
          />
          <Flex gap="$spacing4" flex={1}>
            <Text variant="subheading1" color="$neutral1">
              {t('toucan.auction.nowTradingCard.title', { symbol })}
            </Text>
            <NowTradingCardStats stats={stats} />
          </Flex>
        </Flex>
      )}
      {(initialQueriesLoading || hasChart) && (
        <Flex ref={chartRef} width="100%" height={SPARKLINE_HEIGHT}>
          {initialQueriesLoading || !chartIsMeasured ? (
            <Shimmer>
              <Flex height={SPARKLINE_HEIGHT} borderRadius="$rounded12" backgroundColor="$surface3" />
            </Shimmer>
          ) : (
            <SparklineChart
              width={chartWidth}
              height={SPARKLINE_HEIGHT}
              multichainId={SPARKLINE_KEY}
              sparklineMap={sparklineMap}
              color={accentColor}
              strokeFadeIn
              showGradientFill
              showLiveDot
            />
          )}
        </Flex>
      )}
      {initialQueriesLoading ? (
        <Shimmer>
          <Flex height={48} borderRadius="$rounded16" backgroundColor="$surface3" />
        </Shimmer>
      ) : (
        <ToucanActionButton
          label={t('toucan.auction.nowTradingCard.trade', { symbol })}
          elementName={ElementName.AuctionNowTradingCardTradeButton}
          onPress={navigateToTokenDetails}
        />
      )}
    </Flex>
  )
}
