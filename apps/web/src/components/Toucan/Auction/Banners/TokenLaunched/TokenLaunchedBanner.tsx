import { useQuery } from '@tanstack/react-query'
import { GetClearingPriceHistoryRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { useSporeColors } from 'ui/src'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { logger } from 'utilities/src/logger/logger'
import { TokenLaunchedBannerInner } from '~/components/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBannerInner'
import { TokenLaunchedBannerSkeleton } from '~/components/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBannerSkeleton'
import { TokenLaunchFailedBannerContent } from '~/components/Toucan/Auction/Banners/TokenLaunched/TokenLaunchFailedBannerContent'
import { useTokenLaunchedBannerColorData } from '~/components/Toucan/Auction/Banners/TokenLaunched/useTokenLaunchedBannerColorData'
import { useTokenLaunchedBannerPriceData } from '~/components/Toucan/Auction/Banners/TokenLaunched/useTokenLaunchedBannerPriceData'
import { fromQ96ToDecimalWithTokenDecimals } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { useBidTokenInfo } from '~/components/Toucan/Auction/hooks/useBidTokenInfo'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/components/Toucan/Auction/utils/clearingPrice'

interface TokenLaunchedBannerProps {
  tokenName: string
  tokenColor?: string
  totalSupply?: string
  auctionTokenDecimals?: number
}

/**
 * Container component for the Token Launched Banner
 * Handles data fetching, loading states, and failure states
 * Shows success state when graduated, failure state when not graduated
 */
export function TokenLaunchedBanner({
  tokenName,
  tokenColor,
  totalSupply,
  auctionTokenDecimals = 18,
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

  const { bannerGradient, scrimStyle, accentColor } = useTokenLaunchedBannerColorData({
    tokenColor: isGraduated ? tokenColor : colors.statusCritical.val,
    tokenColorLoading,
    colors,
  })

  // Fetch auction token price from GraphQL (primary data source)
  const {
    data: priceData,
    loading: priceLoading,
    error: priceError,
  } = useTokenLaunchedBannerPriceData({
    tokenAddress,
    chainId,
    skip: !isGraduated || !tokenAddress || !chainId,
  })

  // Fetch bid token info (needed for clearing price fallback conversion to USD)
  const { bidTokenInfo, loading: bidTokenLoading } = useBidTokenInfo({
    bidTokenAddress,
    chainId,
    skip: !isGraduated || !bidTokenAddress || !chainId,
  })

  // Fetch clearing price history for chart fallback (only when GraphQL price fails)
  const needsFallback = isGraduated && !priceLoading && (!priceData || priceError)
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
      auctionTokenDecimals: auctionDetails?.token?.currency.decimals,
    })
    // Convert to USD using bid token's fiat price
    const priceInUSD = clearingPriceDecimal * bidTokenInfo.priceFiat
    return {
      currentTickValue: priceInUSD,
      priceSeries: [] as Array<{ timestamp: number; value: number }>,
      changePercentage: undefined, // No change data available from clearing price
    }
  }, [auctionDetails?.token?.currency.decimals, bidTokenInfo, clearingPrice, priceData])

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
          auctionTokenDecimals: auctionDetails?.token?.currency.decimals,
        }) * bidTokenInfo.priceFiat,
    }))
  }, [auctionDetails?.token?.currency.decimals, bidTokenInfo, clearingHistory, priceData?.priceSeries])

  // Combine primary data with fallback
  const effectivePriceData = priceData ?? fallbackPriceData
  const effectiveChartSeries = priceData?.priceSeries ?? fallbackChartSeries

  // Show failure state if auction didn't graduate
  if (!isGraduated) {
    // Show skeleton while waiting for auction details to load
    const isFailedBannerLoading = !tokenName
    if (isFailedBannerLoading) {
      return <TokenLaunchedBannerSkeleton />
    }
    return <TokenLaunchFailedBannerContent tokenName={tokenName} bannerGradient={bannerGradient} />
  }

  // Show loading skeleton while data is being fetched
  const isLoading = priceLoading || bidTokenLoading || (needsFallback && clearingHistoryLoading)
  if (isLoading) {
    return <TokenLaunchedBannerSkeleton />
  }

  // Don't render if no data available (neither primary nor fallback)
  if (!effectivePriceData) {
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
      tokenName={tokenName}
      tokenColor={tokenColor}
      totalSupply={totalSupply}
      auctionTokenDecimals={auctionTokenDecimals}
      priceData={{
        currentTickValue: effectivePriceData.currentTickValue,
        priceSeries: effectiveChartSeries ?? [],
        changePercentage: effectivePriceData.changePercentage,
      }}
      bannerGradient={bannerGradient}
      scrimStyle={scrimStyle}
      accentColor={accentColor}
    />
  )
}
