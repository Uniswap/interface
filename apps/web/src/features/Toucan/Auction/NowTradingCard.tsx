import { useQuery } from '@tanstack/react-query'
import { HistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { areEvmAddressesEqual, normalizeTokenAddressForCache } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { opacifyRaw, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useCallback, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  getGetTokenHistoryPriceQueryOptions,
  getGetTokenMarketsQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import useResizeObserver from 'use-resize-observer'
import { NumberType } from 'utilities/src/format/types'
import { SparklineChart } from '~/components/Charts/SparklineChart'
import { getTokenDetailsURL } from '~/data/util'
import { useShouldShowNowTradingCard } from '~/features/Toucan/Auction/hooks/useShouldShowNowTradingCard'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'
import { usePrefetchTokenDetailsAuction } from '~/pages/TokenDetails/hooks/usePrefetchTokenDetailsAuction'
import { getChainUrlParam } from '~/utils/params/chainParams'

const SPARKLINE_HEIGHT = 111
const SPARKLINE_KEY = 'auction-token'

export function NowTradingCard(): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prefetchAuction = usePrefetchTokenDetailsAuction()
  const colors = useSporeColors()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { ref: chartRef, width: chartWidth } = useResizeObserver<HTMLElement>()
  const { auctionDetails, tokenColor } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    tokenColor: state.tokenColor,
  }))
  const isVisible = useShouldShowNowTradingCard()
  const tokenIdentifier = auctionDetails
    ? { chainId: auctionDetails.chainId, address: normalizeTokenAddressForCache(auctionDetails.tokenAddress) }
    : undefined
  const { data: marketData, isLoading } = useQuery({
    ...getGetTokenMarketsQueryOptions({
      params: tokenIdentifier ? { tokens: [tokenIdentifier], duration: HistoryDuration.DAY } : undefined,
      enabled: isVisible,
    }),
    placeholderData: undefined,
    refetchInterval: PollingInterval.KindaFast,
  })
  const { data: priceHistory } = useQuery({
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
  const prefetchTokenDetails = useCallback(() => {
    if (auctionDetails) {
      prefetchAuction({ chainId: auctionDetails.chainId, tokenAddress: auctionDetails.tokenAddress })
    }
  }, [auctionDetails, prefetchAuction])

  const onPress = useCallback(() => {
    if (!auctionDetails) {
      return
    }
    prefetchTokenDetails()
    navigate(
      getTokenDetailsURL({
        address: auctionDetails.tokenAddress,
        chainUrlParam: getChainUrlParam(auctionDetails.chainId),
      }),
    )
  }, [auctionDetails, navigate, prefetchTokenDetails])

  if (!isVisible || !auctionDetails) {
    return null
  }

  const symbol = auctionDetails.token?.currency.symbol ?? auctionDetails.tokenSymbol
  const accentColor = tokenColor ?? colors.accent1.val

  const marketFdv = stats?.fullyDilutedValuationUsd
  const volume24h = stats?.volumeUsd
  const formatFiat = (value: number): string => convertFiatAmountFormatted(value, NumberType.FiatTokenStats)
  const showFdv = marketFdv !== undefined && Number.isFinite(marketFdv) && marketFdv > 0
  // FiatTokenStats renders 0 as "-", so treat it as missing.
  const showVolume = volume24h !== undefined && Number.isFinite(volume24h) && volume24h > 0

  return (
    <Flex
      testID={TestID.ToucanNowTradingCard}
      onMouseEnter={prefetchTokenDetails}
      onFocus={prefetchTokenDetails}
      gap="$spacing16"
      p="$spacing16"
      borderRadius="$rounded24"
      borderWidth="$spacing1"
      backgroundColor="$surface1"
      style={{
        borderColor: opacifyRaw(8, accentColor),
        backgroundClip: 'padding-box',
        backgroundImage: `linear-gradient(0deg, ${opacifyRaw(18, accentColor)} 0%, ${opacifyRaw(0, accentColor)} 100%)`,
      }}
    >
      <Flex row alignItems="center" gap="$spacing12">
        <TokenLogo
          url={auctionDetails.token?.logoUrl ?? auctionDetails.tokenImageUrl}
          chainId={auctionDetails.chainId}
          symbol={symbol}
          size={48}
          hideNetworkLogo
        />
        <Flex gap="$spacing4" flex={1}>
          <Text variant="subheading1" color="$neutral1">
            {t('toucan.auction.nowTradingCard.title', { symbol })}
          </Text>
          {isLoading ? (
            <Flex height={16} width={180} borderRadius="$rounded4" backgroundColor="$surface3" />
          ) : (
            (showFdv || showVolume) && (
              <Flex row alignItems="center" gap="$spacing8" flexWrap="wrap">
                {showFdv && (
                  <Text variant="body3" color="$neutral3">
                    <Trans
                      i18nKey="toucan.auction.nowTradingCard.fdv"
                      values={{ fdv: formatFiat(marketFdv) }}
                      components={{ value: <Text variant="body3" color="$neutral2" tag="span" /> }}
                    />
                  </Text>
                )}
                {showFdv && showVolume && (
                  <Flex width={4} height={4} borderRadius="$roundedFull" backgroundColor="$neutral3" />
                )}
                {showVolume && (
                  <Text variant="body3" color="$neutral3">
                    <Trans
                      i18nKey="toucan.auction.nowTradingCard.volume24h"
                      values={{ volume: formatFiat(volume24h) }}
                      components={{ value: <Text variant="body3" color="$neutral2" tag="span" /> }}
                    />
                  </Text>
                )}
              </Flex>
            )
          )}
        </Flex>
      </Flex>
      {sparklinePoints.length > 1 && (
        <Flex ref={chartRef} width="100%" height={SPARKLINE_HEIGHT}>
          {chartWidth !== undefined && chartWidth > 0 && (
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
      <ToucanActionButton
        label={t('toucan.auction.nowTradingCard.trade', { symbol })}
        elementName={ElementName.AuctionNowTradingCardTradeButton}
        onPress={onPress}
      />
    </Flex>
  )
}
