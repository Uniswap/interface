import { useQuery } from '@tanstack/react-query'
import { GetClearingPriceHistoryRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { useSporeColors } from 'ui/src'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { logger } from 'utilities/src/logger/logger'
import { TokenLaunchedBannerInner } from '~/features/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBannerInner'
import { TokenLaunchedBannerSkeleton } from '~/features/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBannerSkeleton'
import { TokenLaunchFailedBannerContent } from '~/features/Toucan/Auction/Banners/TokenLaunched/TokenLaunchFailedBannerContent'
import { TokenRestrictedBannerContent } from '~/features/Toucan/Auction/Banners/TokenLaunched/TokenRestrictedBannerContent'
import { useRealTokenMarketInfo } from '~/features/Toucan/Auction/Banners/TokenLaunched/useRealTokenMarketInfo'
import { useTokenLaunchedBannerColorData } from '~/features/Toucan/Auction/Banners/TokenLaunched/useTokenLaunchedBannerColorData'
import { useTokenLaunchedBannerPriceData } from '~/features/Toucan/Auction/Banners/TokenLaunched/useTokenLaunchedBannerPriceData'
import { fromQ96ToDecimalWithTokenDecimals } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { useAuctionRedemption } from '~/features/Toucan/Auction/hooks/useAuctionRedemption'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useDurationRemaining } from '~/features/Toucan/Auction/hooks/useDurationRemaining'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/features/Toucan/Auction/utils/clearingPrice'
import { isTokenLaunchTradeLive } from '~/features/Toucan/Auction/utils/tokenLaunchedBannerUtils'
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { isTradingRestrictedUntilTge } from '~/features/Toucan/Config/config'

interface TokenLaunchedBannerProps {
  tokenName: string
  tokenColor?: string
  totalSupply?: string
  auctionTokenDecimals?: number
  // Whether the auction status permits trading. The banner additionally requires a live market
  // price before showing "Trade now" — see isTokenLaunchTradeLive.
  isTradeAvailableFromStatus: boolean
  tradeAvailabilityBlock: number | undefined
}

/**
 * Container component for the Token Launched Banner
 * Handles data fetching, loading states, and failure states
 * Shows success state when graduated, failure state when not graduated
 */
// oxlint-disable-next-line complexity
export function TokenLaunchedBanner({
  tokenName,
  tokenColor,
  totalSupply,
  auctionTokenDecimals,
  isTradeAvailableFromStatus,
  tradeAvailabilityBlock,
}: TokenLaunchedBannerProps) {
  const colors = useSporeColors()
  const { isGraduated, auctionDetails, checkpointData, tokenColorLoading } = useAuctionStore((state) => ({
    isGraduated: state.progress.isGraduated,
    auctionDetails: state.auctionDetails,
    checkpointData: state.checkpointData,
    tokenColorLoading: state.tokenColorLoading,
  }))
  const clearingPrice = getClearingPrice(checkpointData, auctionDetails)

  const tokenAddress = auctionDetails?.tokenAddress
  const bidTokenAddress = auctionDetails?.currency
  const chainId = auctionDetails?.chainId
  const auctionAddress = auctionDetails?.address
  const tradeAvailabilityDurationRemaining = useDurationRemaining(
    chainId,
    isTradeAvailableFromStatus ? undefined : tradeAvailabilityBlock,
  )

  const tradingRestrictedUntilTge = Boolean(
    tokenAddress && chainId && isTradingRestrictedUntilTge({ chainId, tokenAddress }),
  )

  // Redeemable virtual-token auctions present the REAL (underlying) token instead: its price/chart,
  // name, FDV, and TDP link. The real token address is read on-chain (gated by a config override).
  const { isRedeemable, realTokenAddress, loading: redemptionLoading } = useAuctionRedemption()
  const priceTokenAddress = isRedeemable ? realTokenAddress : tokenAddress
  const {
    fdvUsd: realTokenFdvUsd,
    name: realTokenName,
    loading: realTokenInfoLoading,
  } = useRealTokenMarketInfo({ tokenAddress: realTokenAddress, chainId, skip: !isRedeemable })

  const { bannerGradient, accentColor } = useTokenLaunchedBannerColorData({
    tokenColor: isGraduated ? tokenColor : colors.statusCritical.val,
    tokenColorLoading,
    colors,
  })

  // Fetch auction token price from GraphQL (primary data source)
  const {
    data: priceData,
    loading: priceLoading,
    error: priceError,
    hasMarketPrice,
  } = useTokenLaunchedBannerPriceData({
    tokenAddress: priceTokenAddress,
    chainId,
    skip: !isGraduated || tradingRestrictedUntilTge || !priceTokenAddress || !chainId,
  })

  // Fetch bid token info (needed for clearing price fallback conversion to USD)
  const { bidTokenInfo, loading: bidTokenLoading } = useBidTokenInfo({
    bidTokenAddress,
    chainId,
    skip: !isGraduated || tradingRestrictedUntilTge || !bidTokenAddress || !chainId,
  })

  // Fetch clearing price history for chart fallback (only when GraphQL price fails)
  const needsFallback = isGraduated && !tradingRestrictedUntilTge && !priceLoading && (!priceData || priceError)
  const { data: clearingPriceResponse, isLoading: clearingHistoryLoading } = useQuery(
    auctionQueries.getClearingPriceHistory({
      params: new GetClearingPriceHistoryRequest({
        chainId,
        address: auctionAddress,
      }),
      enabled: needsFallback && !!chainId && !!auctionAddress,
    }),
  )
  const clearingHistory = clearingPriceResponse?.changes

  // Compute fallback price data from clearing price when GraphQL price is unavailable
  const fallbackPriceData = useMemo(() => {
    // Skip fallback if we have primary data, no clearing price, no bid token info, or no fiat price
    if (priceData || clearingPrice === '0' || !bidTokenInfo || bidTokenInfo.priceFiat === 0) {
      return undefined
    }
    // Convert clearing price from Q96 to decimal (in bid token units)
    const clearingPriceDecimal = fromQ96ToDecimalWithTokenDecimals({
      q96Value: clearingPrice,
      bidTokenDecimals: bidTokenInfo.decimals,
      auctionTokenDecimals: getAuctionTokenDecimals(auctionDetails?.token),
    })
    // Convert to USD using bid token's fiat price
    const priceInUSD = clearingPriceDecimal * bidTokenInfo.priceFiat
    return {
      currentTickValue: priceInUSD,
      priceSeries: [] as Array<{ timestamp: number; value: number }>,
      changePercentage: undefined, // No change data available from clearing price
    }
  }, [auctionDetails?.token, bidTokenInfo, clearingPrice, priceData])

  // Transform clearing price history to chart format for background chart fallback
  const fallbackChartSeries = useMemo(() => {
    // Skip fallback chart if we have primary data, no clearing history, no bid token info, or no fiat price
    if (
      priceData?.priceSeries ||
      !clearingHistory ||
      clearingHistory.length === 0 ||
      !bidTokenInfo ||
      bidTokenInfo.priceFiat === 0
    ) {
      return undefined
    }
    return clearingHistory.map((point) => ({
      timestamp: new Date(point.createdAt).getTime() / 1000,
      value:
        fromQ96ToDecimalWithTokenDecimals({
          q96Value: point.clearingPrice,
          bidTokenDecimals: bidTokenInfo.decimals,
          auctionTokenDecimals: getAuctionTokenDecimals(auctionDetails?.token),
        }) * bidTokenInfo.priceFiat,
    }))
  }, [auctionDetails?.token, bidTokenInfo, clearingHistory, priceData?.priceSeries])

  // Combine primary data with fallback
  const effectivePriceData = priceData ?? fallbackPriceData
  const effectiveChartSeries = priceData?.priceSeries ?? fallbackChartSeries

  // "Trade now" requires both the auction status to permit trading AND a live market price (a pool
  // with liquidity). Without the market-price gate, a graduated auction that committed 0% to LP —
  // which never creates a pool — would advertise "Trade now" and link to an un-tradeable token page.
  // The clearing-price fallback still drives the FDV, so such auctions fall back to "available soon".
  const isTradeAvailable = isTokenLaunchTradeLive({
    isTradeAvailableFromStatus,
    hasLiveMarketPrice: hasMarketPrice,
  })

  // Show failure state if auction didn't graduate
  if (!isGraduated) {
    // Show skeleton while waiting for auction details to load
    const isFailedBannerLoading = !tokenName
    if (isFailedBannerLoading) {
      return <TokenLaunchedBannerSkeleton />
    }
    return <TokenLaunchFailedBannerContent tokenName={tokenName} bannerGradient={bannerGradient} />
  }

  if (tradingRestrictedUntilTge) {
    return <TokenRestrictedBannerContent bannerGradient={bannerGradient} accentColor={accentColor} />
  }

  // Show loading skeleton while data is being fetched
  const isLoading =
    priceLoading ||
    bidTokenLoading ||
    auctionTokenDecimals === undefined ||
    (needsFallback && clearingHistoryLoading) ||
    (isRedeemable && (redemptionLoading || realTokenInfoLoading))
  if (isLoading) {
    return <TokenLaunchedBannerSkeleton />
  }

  // Don't render a tradeable banner if no data is available (neither primary nor fallback).
  // Pre-trade banners should still render because their purpose is status, not price discovery.
  // Redeem banners also always render — they carry the real token's FDV + link, not a price chart.
  if (isTradeAvailableFromStatus && !effectivePriceData && !isRedeemable) {
    logger.warn('TokenLaunchedBanner', 'TokenLaunchedBanner', 'No price data available (primary or fallback)', {
      hasPriceData: !!priceData,
      hasFallbackPriceData: !!fallbackPriceData,
      hasBidTokenInfo: !!bidTokenInfo,
      hasClearingPrice: clearingPrice !== '0',
      priceErrorMessage: priceError?.message,
      tokenAddress,
      chainId,
    })
    return null
  }

  // Show success state with price data
  return (
    <TokenLaunchedBannerInner
      tokenName={isRedeemable ? (realTokenName ?? tokenName) : tokenName}
      tokenColor={tokenColor}
      totalSupply={totalSupply}
      auctionTokenDecimals={auctionTokenDecimals}
      isTradeAvailable={isTradeAvailable}
      tradeAvailabilityDurationRemaining={tradeAvailabilityDurationRemaining}
      priceData={
        effectivePriceData
          ? {
              currentTickValue: effectivePriceData.currentTickValue,
              priceSeries: effectiveChartSeries ?? [],
            }
          : undefined
      }
      bannerGradient={bannerGradient}
      accentColor={accentColor}
      fdvUsdOverride={isRedeemable ? (realTokenFdvUsd ?? null) : undefined}
      tokenDetailsAddress={isRedeemable ? realTokenAddress : undefined}
    />
  )
}
