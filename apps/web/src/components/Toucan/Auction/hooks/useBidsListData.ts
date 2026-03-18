import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { formatUnits } from 'viem'
import { q96ToPriceString } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { useBidTokenInfo } from '~/components/Toucan/Auction/hooks/useBidTokenInfo'
import { AuctionBidStatus, AuctionProgressState, UserBid } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { type BidDisplayState, getBidDisplayInfo } from '~/components/Toucan/Auction/utils/bidDetails'
import { calculateBidFillFraction } from '~/components/Toucan/Auction/utils/calculateBidFillFraction'
import { getClearingPrice } from '~/components/Toucan/Auction/utils/clearingPrice'
import {
  approximateNumberFromRaw,
  computeFdvBidTokenRaw,
  formatCompactFromRaw,
} from '~/components/Toucan/Auction/utils/fixedPointFdv'
import { parseCreatedAt, parseCreatedAtForSort } from '~/components/Toucan/Auction/utils/parseCreatedAt'

// Threshold for considering a bid "complete" (100% filled)
const COMPLETE_FILL_THRESHOLD = 1

interface BidAveragePriceData {
  avgPriceDecimal: number // Raw decimal value for SubscriptZeroPrice component
  avgPriceFiatDisplay: string // e.g., "$0.00021"
  fdvFromAvgPriceDisplay: string // e.g., "450000 ETH" (full precision)
  fdvFromAvgPriceCompactDisplay: string // e.g., "450K ETH" (compact K/M/B format)
  percentBelowClearing: string // e.g., "4% below"
}

export interface BidListItem {
  bid: UserBid
  isInRange: boolean
  // Line 1 display values
  budgetDisplay: string // e.g., "0.3199" (without symbol)
  budgetFiatDisplay: string // e.g., "$1000"
  maxFdvDisplay: string // e.g., "$470.77k"
  timestampMs: number | undefined
  // Line 2 display values
  fillFraction: number // 0-1 for progress bar
  filledPercentageDisplay: string // e.g., "15%"
  // Line 3 display values (null if not applicable)
  averagePriceData: BidAveragePriceData | null
  // Total tokens received display (e.g., "1,234")
  totalTokensReceivedDisplay: string
  // Unified display state (see bidDetails.ts for terminology mapping)
  displayState: BidDisplayState
  // Auction state for progress bar styling
  isAuctionInProgress: boolean
  // Whether auction has ended
  isAuctionEnded: boolean
  // Whether the bid is fully filled (100%)
  isComplete: boolean
  // Bid token symbol for display
  bidTokenSymbol: string
  // Auction token symbol for display
  auctionTokenSymbol: string
  // Whether auction has graduated (for conditional display)
  isGraduated: boolean
}

interface UseBidsListDataResult {
  bidItems: BidListItem[]
  isLoading: boolean
  hasErrors: boolean
  bidTokenSymbol: string | undefined
}

export function useBidsListData(): UseBidsListDataResult {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const { userBids, auctionDetails, onchainCheckpoint, checkpointData, auctionProgress, isGraduated, optimisticBid } =
    useAuctionStore((state) => ({
      userBids: state.userBids,
      auctionDetails: state.auctionDetails,
      onchainCheckpoint: state.onchainCheckpoint,
      checkpointData: state.checkpointData,
      auctionProgress: state.progress.state,
      isGraduated: state.progress.isGraduated,
      optimisticBid: state.optimisticBid,
    }))

  // Use on-chain clearing price during active auction, simulated when ended
  const isAuctionActive = auctionProgress === AuctionProgressState.IN_PROGRESS
  const effectiveCheckpoint = isAuctionActive ? onchainCheckpoint : checkpointData
  const clearingPriceRaw = getClearingPrice(effectiveCheckpoint, auctionDetails)

  const { bidTokenInfo } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId,
  })

  const isLoading = !bidTokenInfo || !auctionDetails || !clearingPriceRaw
  const isAuctionInProgress = auctionProgress === AuctionProgressState.IN_PROGRESS
  const isAuctionEnded = auctionProgress === AuctionProgressState.ENDED

  // Sort bids by creation time (newest first)
  const sortedBids = useMemo(() => {
    return [...userBids].sort((a, b) => parseCreatedAtForSort(b.createdAt) - parseCreatedAtForSort(a.createdAt))
  }, [userBids])

  // Compute clearing price decimal for average price calculations
  const clearingPriceDecimal = useMemo(() => {
    if (!clearingPriceRaw || !bidTokenInfo || !auctionDetails) {
      return 0
    }
    const auctionTokenDecimals = auctionDetails.token?.currency.decimals ?? 18
    const priceString = q96ToPriceString({
      q96Value: clearingPriceRaw,
      bidTokenDecimals: bidTokenInfo.decimals,
      auctionTokenDecimals,
    })
    const parsed = Number.parseFloat(priceString)
    return Number.isFinite(parsed) ? parsed : 0
  }, [clearingPriceRaw, bidTokenInfo, auctionDetails])

  // Process all bids in a single pass
  const { bidItems, hasErrors } = useMemo(() => {
    if (isLoading) {
      return { bidItems: [], hasErrors: false }
    }

    const items: BidListItem[] = []
    let errorCount = 0

    for (const bid of sortedBids) {
      try {
        // Determine if bid is in range
        const isInRange = BigInt(bid.maxPrice) >= BigInt(clearingPriceRaw)

        // Compute fill state
        const fillFraction = calculateBidFillFraction(bid.baseTokenInitial, bid.currencySpent)
        const isComplete = fillFraction >= COMPLETE_FILL_THRESHOLD

        // Compute unified display state
        const { displayState } = getBidDisplayInfo({
          bidStatus: bid.status,
          isInRange,
          isFullyFilled: isComplete,
          auctionProgressState: isAuctionInProgress ? AuctionProgressState.IN_PROGRESS : AuctionProgressState.ENDED,
          isGraduated,
        })

        // Line 1: Budget display values
        const totalBidAmount = Number(formatUnits(BigInt(bid.baseTokenInitial), bidTokenInfo!.decimals))
        const budgetDisplay = formatNumberOrString({
          value: totalBidAmount,
          type: NumberType.TokenNonTx,
        })
        const budgetFiatDisplay =
          bidTokenInfo!.priceFiat === 0
            ? '-'
            : convertFiatAmountFormatted(totalBidAmount * bidTokenInfo!.priceFiat, NumberType.FiatTokenStats)

        // Max FDV calculation
        const auctionTokenDecimals = auctionDetails!.token?.currency.decimals ?? 18
        const totalSupplyRaw = auctionDetails!.tokenTotalSupply
        let maxFdvDisplay = '-'

        if (totalSupplyRaw && totalSupplyRaw !== '0' && bidTokenInfo!.priceFiat !== 0) {
          const maxFdvBidTokenRaw = computeFdvBidTokenRaw({
            priceQ96: bid.maxPrice,
            bidTokenDecimals: bidTokenInfo!.decimals,
            totalSupplyRaw,
            auctionTokenDecimals,
          })
          const maxFdvBidTokenApprox = approximateNumberFromRaw({
            raw: maxFdvBidTokenRaw,
            decimals: bidTokenInfo!.decimals,
            significantDigits: 15,
          })
          maxFdvDisplay = convertFiatAmountFormatted(
            maxFdvBidTokenApprox * bidTokenInfo!.priceFiat,
            NumberType.FiatTokenStats,
          )
        }

        // Line 2: Progress bar values (fillFraction and isComplete computed above)
        // Round to whole percentage for cleaner display
        const filledPercentageDisplay = `${Math.round(fillFraction * 100)}%`

        // Timestamp
        const { timestampMs } = parseCreatedAt(bid.createdAt)

        // Line 3: Average price data (only if tokens received)
        let averagePriceData: BidAveragePriceData | null = null
        const filledBidAmount = Number(formatUnits(BigInt(bid.currencySpent), bidTokenInfo!.decimals))
        const totalTokensReceived =
          auctionDetails!.token?.currency.decimals !== undefined
            ? Number(formatUnits(BigInt(bid.amount), auctionDetails!.token.currency.decimals))
            : 0

        // Format total tokens received
        const totalTokensReceivedDisplay = formatNumberOrString({
          value: totalTokensReceived,
          type: NumberType.TokenNonTx,
        })

        if (totalTokensReceived > 0 && filledBidAmount > 0) {
          // Average price = bid tokens spent / auction tokens received
          const avgPriceInBidTokens = filledBidAmount / totalTokensReceived

          // Fiat value of average price
          const avgPriceFiatValue = avgPriceInBidTokens * bidTokenInfo!.priceFiat
          const avgPriceFiatFormatted =
            bidTokenInfo!.priceFiat === 0
              ? '-'
              : convertFiatAmountFormatted(avgPriceFiatValue, NumberType.FiatTokenPrice)

          // FDV from average price (in bid token, e.g. ETH)
          let fdvFromAvgPriceFormatted = '-'
          let fdvFromAvgPriceCompactFormatted = '-'
          if (totalSupplyRaw && totalSupplyRaw !== '0') {
            const totalSupplyApprox = approximateNumberFromRaw({
              raw: BigInt(totalSupplyRaw),
              decimals: auctionTokenDecimals,
              significantDigits: 15,
            })
            // Calculate FDV in bid tokens (avgPrice * totalSupply)
            const fdvFromAvgPriceInBidTokens = avgPriceInBidTokens * totalSupplyApprox
            const fdvFormatted = formatNumberOrString({
              value: fdvFromAvgPriceInBidTokens,
              type: NumberType.TokenNonTx,
            })
            fdvFromAvgPriceFormatted = `${fdvFormatted} ${bidTokenInfo!.symbol}`

            // Compact format (K/M/B) for Bid list display
            const fdvRaw = BigInt(Math.round(fdvFromAvgPriceInBidTokens * 10 ** bidTokenInfo!.decimals))
            const fdvCompactFormatted = formatCompactFromRaw({
              raw: fdvRaw,
              decimals: bidTokenInfo!.decimals,
              maxFractionDigits: 2,
            })
            fdvFromAvgPriceCompactFormatted = `${fdvCompactFormatted} ${bidTokenInfo!.symbol}`
          }

          // Percent below clearing (truncated to 1 decimal place)
          const clearingPriceFiat = clearingPriceDecimal * bidTokenInfo!.priceFiat
          let percentBelowClearing = 0
          if (clearingPriceFiat > 0) {
            percentBelowClearing = Math.max(0, (clearingPriceFiat - avgPriceFiatValue) / clearingPriceFiat)
          }
          if (Math.abs(percentBelowClearing) < 0.00005) {
            percentBelowClearing = 0
          }
          // Format to 1 decimal place (e.g., "5.4%")
          const percentBelowClearingFormatted = `${(percentBelowClearing * 100).toFixed(1)}%`

          averagePriceData = {
            avgPriceDecimal: avgPriceInBidTokens,
            avgPriceFiatDisplay: avgPriceFiatFormatted,
            fdvFromAvgPriceDisplay: fdvFromAvgPriceFormatted,
            fdvFromAvgPriceCompactDisplay: fdvFromAvgPriceCompactFormatted,
            percentBelowClearing: t('toucan.bid.belowClearing', {
              percent: percentBelowClearingFormatted,
            }),
          }
        }

        items.push({
          bid,
          isInRange,
          budgetDisplay,
          budgetFiatDisplay,
          maxFdvDisplay,
          timestampMs,
          fillFraction,
          filledPercentageDisplay,
          averagePriceData,
          totalTokensReceivedDisplay,
          displayState,
          isAuctionInProgress,
          isAuctionEnded,
          isComplete,
          bidTokenSymbol: bidTokenInfo!.symbol,
          auctionTokenSymbol: auctionDetails!.token?.currency.symbol ?? '',
          isGraduated,
        })
      } catch (error) {
        logger.error(error, {
          tags: { file: 'useBidsListData.ts', function: 'useBidsListData' },
          extra: { bidId: bid.bidId, maxPrice: bid.maxPrice },
        })
        errorCount++
      }
    }

    return { bidItems: items, hasErrors: errorCount > 0 }
  }, [
    sortedBids,
    isLoading,
    clearingPriceRaw,
    bidTokenInfo,
    auctionDetails,
    clearingPriceDecimal,
    formatNumberOrString,
    convertFiatAmountFormatted,
    isAuctionInProgress,
    isAuctionEnded,
    isGraduated,
    t,
  ])

  // Create optimistic bid display item for immediate UI feedback
  const optimisticBidItem: BidListItem | null = useMemo(() => {
    if (!optimisticBid || !bidTokenInfo || !auctionDetails) {
      return null
    }

    // Format budget
    const totalBidAmount = Number(formatUnits(BigInt(optimisticBid.budgetRaw), optimisticBid.bidTokenDecimals))
    const budgetDisplay = formatNumberOrString({
      value: totalBidAmount,
      type: NumberType.TokenNonTx,
    })
    const budgetFiatDisplay =
      bidTokenInfo.priceFiat === 0
        ? '-'
        : convertFiatAmountFormatted(totalBidAmount * bidTokenInfo.priceFiat, NumberType.FiatTokenStats)

    // Format max FDV
    let maxFdvDisplay = '-'
    const totalSupplyRaw = auctionDetails.tokenTotalSupply
    if (totalSupplyRaw && totalSupplyRaw !== '0' && bidTokenInfo.priceFiat !== 0) {
      const auctionTokenDecimals = auctionDetails.token?.currency.decimals ?? 18
      const maxFdvBidTokenRaw = computeFdvBidTokenRaw({
        priceQ96: optimisticBid.maxPriceQ96,
        bidTokenDecimals: optimisticBid.bidTokenDecimals,
        totalSupplyRaw,
        auctionTokenDecimals,
      })
      const maxFdvBidTokenApprox = approximateNumberFromRaw({
        raw: maxFdvBidTokenRaw,
        decimals: optimisticBid.bidTokenDecimals,
        significantDigits: 15,
      })
      maxFdvDisplay = convertFiatAmountFormatted(
        maxFdvBidTokenApprox * bidTokenInfo.priceFiat,
        NumberType.FiatTokenStats,
      )
    }

    return {
      bid: {
        bidId: 'optimistic-pending',
        auctionId: auctionDetails.auctionId,
        walletId: '',
        txHash: optimisticBid.txHash,
        amount: '0',
        maxPrice: optimisticBid.maxPriceQ96,
        createdAt: new Date(optimisticBid.submittedAt).toISOString(),
        status: AuctionBidStatus.Submitted,
        baseTokenInitial: optimisticBid.budgetRaw,
        currencySpent: '0',
      },
      isInRange: true,
      budgetDisplay,
      budgetFiatDisplay,
      maxFdvDisplay,
      timestampMs: optimisticBid.submittedAt,
      fillFraction: 0,
      filledPercentageDisplay: '0%',
      averagePriceData: null,
      totalTokensReceivedDisplay: '0',
      displayState: 'pending',
      isAuctionInProgress: true,
      isAuctionEnded: false,
      isComplete: false,
      bidTokenSymbol: optimisticBid.bidTokenSymbol,
      auctionTokenSymbol: auctionDetails.token?.currency.symbol ?? '',
      isGraduated,
    }
  }, [optimisticBid, bidTokenInfo, auctionDetails, formatNumberOrString, convertFiatAmountFormatted, isGraduated])

  // Prepend optimistic bid to list if present
  const finalBidItems = optimisticBidItem ? [optimisticBidItem, ...bidItems] : bidItems

  return {
    bidItems: finalBidItems,
    isLoading,
    hasErrors,
    bidTokenSymbol: bidTokenInfo?.symbol,
  }
}
