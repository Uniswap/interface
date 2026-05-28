import { useQuery } from '@tanstack/react-query'
import { GetClearingPriceHistoryRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { fromQ96ToDecimalWithTokenDecimals } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { computeCurrentValuationFiatFormatted } from '~/features/Toucan/Auction/hooks/computeCurrentValuationFiat'
import {
  computeHourlyChangePercent,
  formatAsBidToken,
  formatValuationAsBidToken,
} from '~/features/Toucan/Auction/hooks/statsBannerFormatters'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useCurrencyRaisedFormatted } from '~/features/Toucan/Auction/hooks/useCurrencyRaisedFormatted'
import { AuctionProgressState, BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/features/Toucan/Auction/utils/clearingPrice'
import {
  approximateNumberFromRaw,
  formatCompactFromRaw,
  formatTokenAmountWithSymbol,
} from '~/features/Toucan/Auction/utils/fixedPointFdv'
import {
  buildContractInputForAddress,
  buildTokenMarketPriceKey,
  useTokenMarketPrices,
} from '~/features/Toucan/hooks/useTokenMarketPrices'

// When above-floor % exceeds this threshold and hourly data is available, switch to hourly change display
const HOURLY_CHANGE_THRESHOLD = 1000

interface ShouldFetchClearingPriceHistoryParams {
  isAuctionActive: boolean
  hasClearingPriceHistoryParams: boolean
  aboveFloorPercent: number | null
}

function shouldFetchClearingPriceHistory({
  isAuctionActive,
  hasClearingPriceHistoryParams,
  aboveFloorPercent,
}: ShouldFetchClearingPriceHistoryParams): boolean {
  return (
    isAuctionActive &&
    hasClearingPriceHistoryParams &&
    aboveFloorPercent !== null &&
    aboveFloorPercent > HOURLY_CHANGE_THRESHOLD
  )
}

interface StatsBannerData {
  // Current clearing price
  clearingPriceDecimal: number // Raw decimal value for SubscriptZeroPrice component
  clearingPriceFormatted: string // e.g., "1.25 ETH"
  clearingPriceFiatFormatted: string // e.g., "$2,750" (in user's selected fiat currency)
  clearingPriceFiatValue: number | null // Numeric fiat value for SubscriptZeroPrice (in user's currency)
  changePercent: number | null // null if no change (clearing === floor)
  isPositiveChange: boolean
  changeLabel: 'aboveFloor' | 'pastHour' // which label to show next to the change %
  bidTokenSymbol: string | null // e.g., "ETH"
  bidTokenInfo: BidTokenInfo | undefined // Full bid token info for formatting

  // Current valuation (totalSupply * clearingPrice)
  currentValuationFormatted: string // e.g., "224.5k ETH"
  currentValuationFiatFormatted: string // e.g., "$494.9M" (in user's selected fiat currency)

  // Bids concentration (from concentration band)
  concentrationStartDecimal: number | null // Raw decimal value for SubscriptZeroPrice
  concentrationEndDecimal: number | null // Raw decimal value for SubscriptZeroPrice
  concentrationFiatRangeFormatted: string | null // e.g., "$0.0463 – $0.0563" (fiat price range)
  concentrationStartFiatValue: number | null // Numeric fiat value for SubscriptZeroPrice (in user's currency)
  concentrationEndFiatValue: number | null // Numeric fiat value for SubscriptZeroPrice (in user's currency)

  // Total committed volume (totalBidVolume from auction details)
  totalBidVolumeFormatted: string | null // e.g., "12.4k ETH"
  totalBidVolumeFiatFormatted: string | null // e.g., "$27.3M" (in user's selected fiat currency)

  // Currency raised at clearing price (from checkpoint data) - for tooltip
  currencyRaisedFormatted: string | null // e.g., "12.4k ETH"

  // Required currency to graduate (requiredCurrencyRaised from auction details) - for tooltip
  requiredCurrencyFormatted: string | null // e.g., "10k ETH"

  // Loading state
  isLoading: boolean
  hasData: boolean

  // Auction state
  isAuctionEnded: boolean
  isAuctionNotStarted: boolean
}

/**
 * Hook that computes all data needed for the AuctionStatsBanner.
 *
 * This hook:
 * - Gets clearing price, floor price, and total supply from auction store
 * - Calculates change % between clearing and floor price
 * - Computes current valuation (totalSupply * clearingPrice)
 * - Gets concentration band data
 * - Formats all values for display (both in bid tokens and fiat)
 *
 * Note: Fiat values show "--" when priceFiat is unavailable (e.g., testnets)
 */
export function useStatsBannerData(): StatsBannerData {
  const { convertFiatAmount, convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  // Get auction data from store
  const { auctionDetails, concentrationBand, auctionProgressState, checkpointData, onchainCheckpoint } =
    useAuctionStore((state) => ({
      auctionDetails: state.auctionDetails,
      concentrationBand: state.concentrationBand,
      auctionProgressState: state.progress.state,
      checkpointData: state.checkpointData,
      onchainCheckpoint: state.onchainCheckpoint,
    }))

  // Get bid token info
  const { bidTokenInfo, loading: bidTokenLoading } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId,
  })
  const auctionChainId = auctionDetails?.chainId
  const bidTokenAddress = auctionDetails?.currency
  const auctionTokenAddress = auctionDetails?.tokenAddress

  const bidTokenContracts = useMemo(() => {
    if (!auctionChainId || !bidTokenAddress) {
      return []
    }

    return [
      buildContractInputForAddress({
        chainId: auctionChainId,
        address: bidTokenAddress,
        resolveNativeAddress: true,
      }),
    ]
  }, [auctionChainId, bidTokenAddress])

  const { priceMap: bidTokenMarketPriceMap } = useTokenMarketPrices(bidTokenContracts)

  const auctionTokenContracts = useMemo(() => {
    if (!auctionChainId || !auctionTokenAddress) {
      return []
    }

    return [
      buildContractInputForAddress({
        chainId: auctionChainId,
        address: auctionTokenAddress,
      }),
    ]
  }, [auctionChainId, auctionTokenAddress])

  const { priceMap: auctionTokenMarketPriceMap } = useTokenMarketPrices(auctionTokenContracts)

  // Use the same market price source as top auctions table/chips for committed volume consistency.
  const bidTokenMarketPriceUsd = useMemo(() => {
    if (!auctionChainId || !bidTokenAddress) {
      return undefined
    }

    const key = buildTokenMarketPriceKey({
      chainId: auctionChainId,
      address: bidTokenAddress,
    })
    return bidTokenMarketPriceMap[key]
  }, [auctionChainId, bidTokenAddress, bidTokenMarketPriceMap])

  const auctionTokenMarketPriceUsd = useMemo(() => {
    if (!auctionChainId || !auctionTokenAddress) {
      return undefined
    }

    const key = buildTokenMarketPriceKey({
      chainId: auctionChainId,
      address: auctionTokenAddress,
    })
    return auctionTokenMarketPriceMap[key]
  }, [auctionChainId, auctionTokenAddress, auctionTokenMarketPriceMap])

  // Extract auction parameters
  // Use on-chain clearing price during active auction for display consistency with isInRange
  // Use simulated clearing price when auction has ended (preserves final state)
  const isAuctionActive = auctionProgressState === AuctionProgressState.IN_PROGRESS
  const effectiveCheckpoint = isAuctionActive ? onchainCheckpoint : checkpointData
  const clearingPrice = getClearingPrice(effectiveCheckpoint, auctionDetails)
  const floorPrice = auctionDetails?.floorPrice ?? '0'
  const totalSupply = auctionDetails?.tokenTotalSupply ?? '0'
  const auctionTokenDecimals = auctionDetails?.token?.currency.decimals ?? 18

  const parseQ96ToDecimal = useMemo(
    () => (q96Value: string) =>
      fromQ96ToDecimalWithTokenDecimals({
        q96Value,
        bidTokenDecimals: bidTokenInfo?.decimals,
        auctionTokenDecimals,
      }),
    [auctionTokenDecimals, bidTokenInfo?.decimals],
  )

  // Convert Q96 prices to decimal using bid-token decimals when available
  const clearingPriceDecimal = useMemo(() => parseQ96ToDecimal(clearingPrice), [clearingPrice, parseQ96ToDecimal])
  const floorPriceDecimal = useMemo(() => parseQ96ToDecimal(floorPrice), [floorPrice, parseQ96ToDecimal])

  // Calculate change percentage relative to floor price
  const aboveFloorPercent = useMemo(() => {
    if (floorPriceDecimal === 0 || clearingPriceDecimal === floorPriceDecimal) {
      return null
    }
    return ((clearingPriceDecimal - floorPriceDecimal) / floorPriceDecimal) * 100
  }, [clearingPriceDecimal, floorPriceDecimal])

  // When above-floor % is extreme, fetch clearing price history to show hourly change instead.
  // This query shares the same react-query cache key as the chart, so no extra network request.
  const clearingPriceHistoryParams = useMemo(
    () =>
      auctionDetails
        ? new GetClearingPriceHistoryRequest({ chainId: auctionDetails.chainId, address: auctionDetails.address })
        : undefined,
    [auctionDetails],
  )

  const shouldFetchHistory = shouldFetchClearingPriceHistory({
    isAuctionActive,
    hasClearingPriceHistoryParams: !!clearingPriceHistoryParams,
    aboveFloorPercent,
  })

  const { data: clearingPriceHistoryResponse } = useQuery(
    auctionQueries.getClearingPriceHistory({
      params: clearingPriceHistoryParams ?? new GetClearingPriceHistoryRequest(),
      enabled: shouldFetchHistory,
    }),
  )

  const hourlyChangePercent = useMemo(() => {
    if (!shouldFetchHistory) {
      return null
    }
    return computeHourlyChangePercent({
      clearingPriceDecimal,
      changes: clearingPriceHistoryResponse?.changes,
      bidTokenDecimals: bidTokenInfo?.decimals,
      auctionTokenDecimals,
    })
  }, [
    shouldFetchHistory,
    clearingPriceHistoryResponse,
    clearingPriceDecimal,
    bidTokenInfo?.decimals,
    auctionTokenDecimals,
  ])

  const changePercent = hourlyChangePercent ?? aboveFloorPercent
  const changeLabel: StatsBannerData['changeLabel'] = hourlyChangePercent !== null ? 'pastHour' : 'aboveFloor'

  // Format number helper
  const formatNumber = useMemo(
    () => (value: number, type: NumberType) => formatNumberOrString({ value: value.toString(), type }),
    [formatNumberOrString],
  )

  // Format clearing price
  const clearingPriceFormatted = useMemo(() => {
    if (!bidTokenInfo) {
      return '--'
    }
    return formatAsBidToken({
      tickValue: clearingPriceDecimal,
      bidTokenInfo,
      formatNumber,
    })
  }, [clearingPriceDecimal, bidTokenInfo, formatNumber])

  // Format clearing price in user's selected fiat currency (no "USD" suffix - currency symbol is included)
  // Returns "--" when priceFiat is unavailable (e.g., testnets without price feeds)
  const clearingPriceFiatFormatted = useMemo(() => {
    if (!bidTokenInfo || bidTokenInfo.priceFiat === 0) {
      return '--'
    }
    const fiatValue = clearingPriceDecimal * bidTokenInfo.priceFiat
    return convertFiatAmountFormatted(fiatValue, NumberType.FiatTokenPrice)
  }, [clearingPriceDecimal, bidTokenInfo, convertFiatAmountFormatted])

  // Numeric fiat value for SubscriptZeroPrice (converted to user's selected currency)
  const clearingPriceFiatValue = useMemo(() => {
    if (!bidTokenInfo || bidTokenInfo.priceFiat === 0) {
      return null
    }
    const usdValue = clearingPriceDecimal * bidTokenInfo.priceFiat
    return convertFiatAmount(usdValue).amount
  }, [clearingPriceDecimal, bidTokenInfo, convertFiatAmount])

  // Calculate and format current valuation (totalSupply * clearingPrice)
  const currentValuationFormatted = useMemo(() => {
    if (!bidTokenInfo || !totalSupply || totalSupply === '0') {
      return '--'
    }
    return formatValuationAsBidToken({
      tickQ96: clearingPrice,
      totalSupply,
      auctionTokenDecimals,
      bidTokenInfo,
    })
  }, [auctionTokenDecimals, bidTokenInfo, clearingPrice, totalSupply])

  // Format current valuation in user's selected fiat currency (no "USD" suffix)
  // For completed auctions, this should represent FDV at launch using launch-time clearing
  // price and launch-time bid-token USD price from auction details.
  // Fall back to auction token market price, then current bid token price.
  // Returns "--" when required price data is unavailable.
  const currentValuationFiatFormatted = useMemo(
    () =>
      computeCurrentValuationFiatFormatted({
        totalSupplyRaw: totalSupply,
        auctionProgressState,
        auctionTokenDecimals,
        clearingPriceQ96: clearingPrice,
        launchBidTokenPriceUsdRaw: auctionDetails?.currencyPriceUsd,
        bidTokenInfo,
        auctionTokenMarketPriceUsd,
        bidTokenMarketPriceUsd,
        convertFiatAmountFormatted,
      }),
    [
      auctionDetails?.currencyPriceUsd,
      auctionProgressState,
      auctionTokenDecimals,
      auctionTokenMarketPriceUsd,
      bidTokenInfo,
      bidTokenMarketPriceUsd,
      clearingPrice,
      convertFiatAmountFormatted,
      totalSupply,
    ],
  )

  // Format concentration band values
  // Returns null for fiat range when priceFiat is unavailable
  const concentrationData = useMemo(() => {
    if (!concentrationBand || !bidTokenInfo) {
      return {
        startDecimal: null,
        endDecimal: null,
        fiatRangeFormatted: null,
        startFiatValue: null,
        endFiatValue: null,
      }
    }

    // Return raw decimal values for SubscriptZeroPrice component
    const startDecimal = concentrationBand.startTick
    const endDecimal = concentrationBand.endTick

    // Format fiat price range (for the subtitle) - only if priceFiat available
    if (bidTokenInfo.priceFiat === 0) {
      return {
        startDecimal,
        endDecimal,
        fiatRangeFormatted: null,
        startFiatValue: null,
        endFiatValue: null,
      }
    }

    // Convert tick prices (in bid token) to USD, then to user's currency
    const startUsdValue = startDecimal * bidTokenInfo.priceFiat
    const endUsdValue = endDecimal * bidTokenInfo.priceFiat

    // Numeric fiat values in user's currency for SubscriptZeroPrice
    const startFiatValue = convertFiatAmount(startUsdValue).amount
    const endFiatValue = convertFiatAmount(endUsdValue).amount

    const startFiatFormatted = convertFiatAmountFormatted(startUsdValue, NumberType.FiatTokenPrice)
    const endFiatFormatted = convertFiatAmountFormatted(endUsdValue, NumberType.FiatTokenPrice)

    return {
      startDecimal,
      endDecimal,
      fiatRangeFormatted: `${startFiatFormatted} – ${endFiatFormatted}`,
      startFiatValue,
      endFiatValue,
    }
  }, [concentrationBand, bidTokenInfo, convertFiatAmount, convertFiatAmountFormatted])

  // Format total bid volume from auction details
  // The value is in raw bid token units (e.g., wei for ETH)
  // Uses fixed decimals with trailing zeros: 3 for abbreviated (K/M/B/T), 2 for stablecoins, 5 for others
  // Returns null for fiat when priceFiat is unavailable
  const totalBidVolume = useMemo(() => {
    const totalBidVolumeRaw = auctionDetails?.totalBidVolume
    if (!totalBidVolumeRaw || !bidTokenInfo) {
      return { formatted: null as string | null, fiatFormatted: null as string | null }
    }

    const rawBigInt = BigInt(totalBidVolumeRaw)

    const formattedWithSymbol = formatTokenAmountWithSymbol({
      raw: rawBigInt,
      decimals: bidTokenInfo.decimals,
      symbol: bidTokenInfo.symbol,
      isStablecoin: bidTokenInfo.isStablecoin,
    })

    // Convert to fiat value only if market price is available
    if (!bidTokenMarketPriceUsd) {
      return { formatted: formattedWithSymbol, fiatFormatted: null }
    }

    const totalBidVolumeApprox = approximateNumberFromRaw({
      raw: rawBigInt,
      decimals: bidTokenInfo.decimals,
      significantDigits: 15,
    })
    const fiatValue = totalBidVolumeApprox * bidTokenMarketPriceUsd
    const fiatFormatted = convertFiatAmountFormatted(fiatValue, NumberType.FiatTokenStats)

    return { formatted: formattedWithSymbol, fiatFormatted }
  }, [auctionDetails?.totalBidVolume, bidTokenInfo, bidTokenMarketPriceUsd, convertFiatAmountFormatted])

  // Format currency raised at clearing price from checkpoint data
  const currencyRaisedFormatted = useCurrencyRaisedFormatted({
    currencyRaisedRaw: checkpointData?.currencyRaised,
    bidTokenInfo,
  })

  // Format required currency to graduate
  const requiredCurrencyFormatted = useMemo(() => {
    const requiredCurrencyRaw = auctionDetails?.requiredCurrencyRaised
    if (!requiredCurrencyRaw || !bidTokenInfo) {
      return null
    }
    const formatted = formatCompactFromRaw({
      raw: BigInt(requiredCurrencyRaw),
      decimals: bidTokenInfo.decimals,
      maxFractionDigits: 2,
    })
    return `${formatted} ${bidTokenInfo.symbol}`
  }, [auctionDetails?.requiredCurrencyRaised, bidTokenInfo])

  // Determine loading state
  const isLoading = bidTokenLoading || !auctionDetails
  const hasData = !isLoading && bidTokenInfo !== undefined
  const isAuctionEnded = auctionProgressState === AuctionProgressState.ENDED
  const isAuctionNotStarted = auctionProgressState === AuctionProgressState.NOT_STARTED

  return {
    clearingPriceDecimal,
    clearingPriceFormatted,
    clearingPriceFiatFormatted,
    clearingPriceFiatValue,
    changePercent,
    isPositiveChange: (changePercent ?? 0) > 0,
    changeLabel,
    bidTokenSymbol: bidTokenInfo?.symbol ?? null,
    bidTokenInfo,
    currentValuationFormatted,
    currentValuationFiatFormatted,
    concentrationStartDecimal: concentrationData.startDecimal,
    concentrationEndDecimal: concentrationData.endDecimal,
    concentrationFiatRangeFormatted: concentrationData.fiatRangeFormatted,
    concentrationStartFiatValue: concentrationData.startFiatValue,
    concentrationEndFiatValue: concentrationData.endFiatValue,
    totalBidVolumeFormatted: totalBidVolume.formatted,
    totalBidVolumeFiatFormatted: totalBidVolume.fiatFormatted,
    currencyRaisedFormatted,
    requiredCurrencyFormatted,
    isLoading,
    hasData,
    isAuctionEnded,
    isAuctionNotStarted,
  }
}
