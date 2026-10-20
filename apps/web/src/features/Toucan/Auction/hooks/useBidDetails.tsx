import { type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { formatUnits } from '~/chains'
import { q96ToPriceString } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import {
  AuctionBidStatus,
  AuctionDetails,
  AuctionOutcome,
  AuctionProgressState,
  BidTokenInfo,
  UserBid,
} from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getBidDescription } from '~/features/Toucan/Auction/utils/bidDescription'
import {
  type BidDisplayState,
  computeIsFullyFilled,
  formatTokenAmountWithSubscript,
  getBidDisplayInfo,
} from '~/features/Toucan/Auction/utils/bidDetails'
import { calculateBidFillFraction } from '~/features/Toucan/Auction/utils/calculateBidFillFraction'
import {
  approximateNumberFromRaw,
  computeFdvBidTokenRaw,
  computeFractionFromRaw,
  formatCompactFromRaw,
} from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { safeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { hasTokenTotalSupply } from '~/features/Toucan/Auction/utils/tokenTotalSupply'

interface UseBidDetailsParams {
  bid: UserBid
  isInRange: boolean
  bidTokenInfo: BidTokenInfo
  auctionDetails: AuctionDetails
  clearingPrice: string
  /** Settled outcome, the only safe input for copy about the bidder's funds. */
  outcome: AuctionOutcome
  /**
   * Whether the graduation threshold is already met. Unlike `outcome` this can be true while the
   * auction is still running, which is what gates the mid-auction "refund unused budget" action.
   * `undefined` while undecided: the refund action stays hidden and the copy makes no threshold claim.
   */
  hasMetThreshold: boolean | undefined
  auctionProgressState: AuctionProgressState
}

interface ButtonState {
  isEnabled: boolean
  isVisible: boolean
  label: string
  tooltip?: string
  action: 'exit' | 'claim'
}

interface AveragePriceData {
  avgPriceDecimal: number
  bidTokenSymbol: string
  avgPriceFiat: string
  fdvFromAvgPriceDisplay: string
  percentBelowClearing: string
}

interface BidDetails {
  displayState: BidDisplayState
  spentAmount: number
  maxBudgetAmount: number
  spentFraction: number
  refundBudgetAmount: number
  refundBudgetSubtext: string
  refundBudgetLabel: string
  totalTokensReceivedDisplay: string
  /** `null` when the token's total supply is unknown, so the range marker can be suppressed. */
  fdvFraction: number | null
  maxFdvDisplay: string
  currentFdvDisplay: string
  buttonState: ButtonState
  description: ReactNode
  showUnusedBudgetCard: boolean
  pricingCopy: {
    amount: string
    returnText: string
  }
  filledPercentageDisplay: string
  averagePriceData: AveragePriceData | null
}

export function useBidDetails({
  bid,
  isInRange,
  bidTokenInfo,
  auctionDetails,
  clearingPrice,
  outcome,
  hasMetThreshold,
  auctionProgressState,
}: UseBidDetailsParams): BidDetails {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const { t } = useTranslation()
  const pendingWithdrawalBidIds = useAuctionStore((state) => state.pendingWithdrawalBidIds)
  const awaitingConfirmationBidIds = useAuctionStore((state) => state.awaitingConfirmationBidIds)
  const currentBlockNumber = useAuctionStore((state) => state.currentBlockNumber)

  // Check if we're in the window between auction end and claim period start
  const isInPreClaimWindow = useMemo(() => {
    const claimBlock = auctionDetails.claimBlock
    if (!claimBlock || !currentBlockNumber) {
      return false
    }
    return currentBlockNumber < Number(claimBlock)
  }, [auctionDetails.claimBlock, currentBlockNumber])
  const isExited = bid.status === AuctionBidStatus.Exited
  const isFullyFilled = computeIsFullyFilled(bid)
  const isAuctionInProgress = auctionProgressState === AuctionProgressState.IN_PROGRESS

  // Use unified getBidDisplayInfo for all display state derivation
  const { displayState, descriptionState } = useMemo(
    () =>
      getBidDisplayInfo({
        bidStatus: bid.status,
        isInRange,
        isFullyFilled,
        isAuctionInProgress,
        outcome,
        isInPreClaimWindow,
        hasMetThreshold,
      }),
    [bid.status, isInRange, isFullyFilled, isAuctionInProgress, outcome, isInPreClaimWindow, hasMetThreshold],
  )

  const spentFraction = useMemo(
    () => calculateBidFillFraction(bid.baseTokenInitial, bid.currencySpent),
    [bid.baseTokenInitial, bid.currencySpent],
  )

  const filledBidAmount = useMemo(() => {
    try {
      return Number(formatUnits(BigInt(bid.currencySpent), bidTokenInfo.decimals))
    } catch {
      return 0
    }
  }, [bid.currencySpent, bidTokenInfo.decimals])

  const maxBudgetAmount = useMemo(() => {
    try {
      return Number(formatUnits(BigInt(bid.baseTokenInitial), bidTokenInfo.decimals))
    } catch {
      return 0
    }
  }, [bid.baseTokenInitial, bidTokenInfo.decimals])

  const unusedBudgetRaw = useMemo(() => {
    const total = BigInt(bid.baseTokenInitial)
    const spent = BigInt(bid.currencySpent)
    return total > spent ? total - spent : 0n
  }, [bid.baseTokenInitial, bid.currencySpent])

  const totalTokensReceived = useMemo(() => {
    const decimals = getAuctionTokenDecimals(auctionDetails.token)
    if (decimals === undefined) {
      return 0
    }
    return Number(formatUnits(BigInt(bid.amount), decimals))
  }, [auctionDetails.token, bid.amount])

  const refundBudgetAmount = useMemo(() => {
    try {
      return Number(formatUnits(unusedBudgetRaw, bidTokenInfo.decimals))
    } catch {
      return 0
    }
  }, [bidTokenInfo.decimals, unusedBudgetRaw])

  const maxBudgetTokenDisplay = useMemo(() => {
    return formatTokenAmountWithSubscript({
      raw: BigInt(bid.baseTokenInitial),
      decimals: bidTokenInfo.decimals,
      symbol: bidTokenInfo.symbol,
    })
  }, [bid.baseTokenInitial, bidTokenInfo.decimals, bidTokenInfo.symbol])

  const totalTokensReceivedDisplay = useMemo(
    () =>
      formatNumberOrString({
        value: totalTokensReceived,
        type: NumberType.TokenNonTx,
      }),
    [formatNumberOrString, totalTokensReceived],
  )

  const clearingPriceDecimal = useMemo(() => {
    const auctionTokenDecimals = getAuctionTokenDecimals(auctionDetails.token)
    if (auctionTokenDecimals === undefined) {
      return 0
    }
    const priceString = q96ToPriceString({
      q96Value: clearingPrice,
      bidTokenDecimals: bidTokenInfo.decimals,
      auctionTokenDecimals,
    })
    const parsed = Number.parseFloat(priceString)
    return Number.isFinite(parsed) ? parsed : 0
  }, [auctionDetails.token, bidTokenInfo.decimals, clearingPrice])

  const { fdvFraction, maxFdvBidTokenRaw, currentFdvBidTokenRaw } = useMemo<{
    fdvFraction: number | null
    maxFdvBidTokenRaw: bigint | null
    currentFdvBidTokenRaw: bigint | null
  }>(() => {
    const auctionTokenDecimals = getAuctionTokenDecimals(auctionDetails.token)
    const totalSupplyRaw = auctionDetails.tokenTotalSupply

    // Unknown supply, not a zero valuation: `0n` would format as a confident "0 ETH" FDV and pin the
    // range marker at the bottom of the bar.
    if (!hasTokenTotalSupply(totalSupplyRaw) || auctionTokenDecimals === undefined) {
      return { fdvFraction: null, maxFdvBidTokenRaw: null, currentFdvBidTokenRaw: null }
    }

    // oxlint-disable-next-line no-shadow
    const maxFdvBidTokenRaw = computeFdvBidTokenRaw({
      priceQ96: bid.maxPrice,
      bidTokenDecimals: bidTokenInfo.decimals,
      totalSupplyRaw,
      auctionTokenDecimals,
    })

    // oxlint-disable-next-line no-shadow
    const currentFdvBidTokenRaw = computeFdvBidTokenRaw({
      priceQ96: clearingPrice,
      bidTokenDecimals: bidTokenInfo.decimals,
      totalSupplyRaw,
      auctionTokenDecimals,
    })

    const fraction = computeFractionFromRaw({ numeratorRaw: currentFdvBidTokenRaw, denominatorRaw: maxFdvBidTokenRaw })

    return {
      fdvFraction: fraction,
      maxFdvBidTokenRaw,
      currentFdvBidTokenRaw,
    }
  }, [clearingPrice, auctionDetails.token, auctionDetails.tokenTotalSupply, bid.maxPrice, bidTokenInfo.decimals])

  const maxFdvDisplay = useMemo(() => {
    if (maxFdvBidTokenRaw === null) {
      return '-'
    }
    const formatted = formatCompactFromRaw({ raw: maxFdvBidTokenRaw, decimals: bidTokenInfo.decimals })
    return `${formatted} ${bidTokenInfo.symbol}`
  }, [bidTokenInfo.decimals, bidTokenInfo.symbol, maxFdvBidTokenRaw])

  const currentFdvDisplay = useMemo(() => {
    if (currentFdvBidTokenRaw === null) {
      return '-'
    }
    const formatted = formatCompactFromRaw({ raw: currentFdvBidTokenRaw, decimals: bidTokenInfo.decimals })
    return `${formatted} ${bidTokenInfo.symbol}`
  }, [bidTokenInfo.decimals, bidTokenInfo.symbol, currentFdvBidTokenRaw])

  const launchThresholdDisplay = useMemo(() => {
    const requiredRaw = safeBigInt(auctionDetails.requiredCurrencyRaised)
    if (requiredRaw === null) {
      return '-'
    }
    const formatted = formatCompactFromRaw({ raw: requiredRaw, decimals: bidTokenInfo.decimals })
    return `${formatted} ${bidTokenInfo.symbol}`
  }, [auctionDetails.requiredCurrencyRaised, bidTokenInfo.decimals, bidTokenInfo.symbol])

  // ─────────────────────────────────────────────────────────────────
  // Button State & UI Logic
  // ─────────────────────────────────────────────────────────────────
  const buttonState = useMemo<ButtonState>(() => {
    const isAuctionEnded = auctionProgressState === AuctionProgressState.ENDED

    // Auction over - hide button UNLESS we're in the pre-claim window
    // for a graduated auction with out-of-range bids (allow exit during this window)
    if (isAuctionEnded) {
      // Allow refund button during pre-claim window for graduated auctions with out-of-range bids
      if (outcome === AuctionOutcome.GRADUATED && isInPreClaimWindow && !isInRange) {
        const isBidPending = pendingWithdrawalBidIds.has(bid.bidId) || awaitingConfirmationBidIds.has(bid.bidId)
        return {
          isEnabled: !isExited && !isBidPending,
          isVisible: true,
          label: isExited ? t('toucan.auction.budgetRefunded') : t('toucan.auction.refundUnusedBudget'),
          action: 'exit',
        }
      }
      return { isEnabled: false, isVisible: false, label: '', action: 'exit' }
    }

    // State 3: In progress + out of range + graduation threshold already met
    if (isAuctionInProgress && !isInRange && hasMetThreshold === true) {
      // Check if THIS specific bid is pending withdrawal, not global state
      const isBidPending = pendingWithdrawalBidIds.has(bid.bidId) || awaitingConfirmationBidIds.has(bid.bidId)
      return {
        isEnabled: !isExited && !isBidPending,
        isVisible: true,
        label: isExited ? t('toucan.auction.budgetRefunded') : t('toucan.auction.refundUnusedBudget'),
        action: 'exit',
      }
    }

    return { isEnabled: false, isVisible: false, label: '', action: 'exit' }
  }, [
    auctionProgressState,
    awaitingConfirmationBidIds,
    bid.bidId,
    hasMetThreshold,
    isAuctionInProgress,
    outcome,
    isInPreClaimWindow,
    isInRange,
    isExited,
    pendingWithdrawalBidIds,
    t,
  ])

  const description = useMemo<ReactNode>(
    () =>
      getBidDescription({
        descriptionState,
        tokenSymbol: auctionDetails.token?.currency.symbol,
        valuationSummary: maxFdvDisplay,
        launchThresholdSummary: launchThresholdDisplay,
      }),
    [descriptionState, maxFdvDisplay, launchThresholdDisplay, auctionDetails.token?.currency.symbol],
  )

  const showUnusedBudgetCard = !isInRange
  const refundBudgetLabel = useMemo(
    () => (isExited ? t('toucan.bidDetails.label.refundedBudget') : t('toucan.bidDetails.label.unusedBudget')),
    [isExited, t],
  )
  const refundBudgetSubtext = useMemo(
    () => t('toucan.bidDetails.label.budgetOf', { amount: maxBudgetTokenDisplay }),
    [maxBudgetTokenDisplay, t],
  )

  const pricingCopy = useMemo(() => {
    if (totalTokensReceived === 0) {
      return {
        amount: '-',
        returnText: '-',
      }
    }

    // When priceFiat is unavailable (0), show "-" for fiat values
    if (bidTokenInfo.priceFiat === 0) {
      return {
        amount: '-',
        returnText: '-',
      }
    }

    const pricePerTokenFiat = (filledBidAmount * bidTokenInfo.priceFiat) / totalTokensReceived
    const amountFormatted = convertFiatAmountFormatted(pricePerTokenFiat, NumberType.FiatTokenPrice)

    const clearingPriceFiat = clearingPriceDecimal * bidTokenInfo.priceFiat
    let returnRatio = pricePerTokenFiat > 0 ? (clearingPriceFiat - pricePerTokenFiat) / pricePerTokenFiat : 0
    // Avoid showing -0.00% for very small negative numbers
    if (Math.abs(returnRatio) < 0.00005) {
      returnRatio = 0
    }

    const returnFormatted = formatNumberOrString({
      value: returnRatio,
      type: NumberType.Percentage,
    })

    return {
      amount: t('toucan.bidReview.perToken', { amount: amountFormatted }),
      returnText: `(${returnFormatted} return)`,
    }
  }, [
    bidTokenInfo.priceFiat,
    clearingPriceDecimal,
    convertFiatAmountFormatted,
    filledBidAmount,
    formatNumberOrString,
    t,
    totalTokensReceived,
  ])

  const filledPercentageDisplay = useMemo(() => {
    const percentageFormatted = formatNumberOrString({
      value: spentFraction,
      type: NumberType.Percentage,
    })
    return t('toucan.bidDetails.filledPercent', { percentage: percentageFormatted })
  }, [formatNumberOrString, spentFraction, t])

  const averagePriceData = useMemo<AveragePriceData | null>(() => {
    if (totalTokensReceived === 0 || filledBidAmount === 0) {
      return null
    }

    // Average price = bid tokens spent / auction tokens received
    const avgPriceInBidTokens = filledBidAmount / totalTokensReceived

    // When priceFiat is unavailable (0), show "-" for fiat values but still show bid token values
    const hasPriceFiat = bidTokenInfo.priceFiat !== 0

    // Fiat value of average price
    const avgPriceFiatValue = avgPriceInBidTokens * bidTokenInfo.priceFiat
    const avgPriceFiatFormatted = hasPriceFiat
      ? convertFiatAmountFormatted(avgPriceFiatValue, NumberType.FiatTokenPrice)
      : '-'

    // FDV from average price = avgPriceFiat × totalSupply
    const auctionTokenDecimals = getAuctionTokenDecimals(auctionDetails.token)
    const totalSupplyRaw = auctionDetails.tokenTotalSupply
    let fdvFromAvgPriceFormatted = '-'

    if (hasPriceFiat && totalSupplyRaw && totalSupplyRaw !== '0' && auctionTokenDecimals !== undefined) {
      const totalSupplyApprox = approximateNumberFromRaw({
        raw: BigInt(totalSupplyRaw),
        decimals: auctionTokenDecimals,
        significantDigits: 15,
      })
      const fdvFromAvgPrice = avgPriceFiatValue * totalSupplyApprox
      fdvFromAvgPriceFormatted = convertFiatAmountFormatted(fdvFromAvgPrice, NumberType.FiatTokenStats)
    }

    // Percent below clearing = (clearingPriceFiat - avgPriceFiat) / clearingPriceFiat
    const clearingPriceFiat = clearingPriceDecimal * bidTokenInfo.priceFiat
    let percentBelowClearing = 0
    if (hasPriceFiat && clearingPriceFiat > 0) {
      percentBelowClearing = Math.max(0, (clearingPriceFiat - avgPriceFiatValue) / clearingPriceFiat)
    }
    // Avoid showing -0.00% for very small numbers
    if (Math.abs(percentBelowClearing) < 0.00005) {
      percentBelowClearing = 0
    }

    const percentBelowClearingFormatted = hasPriceFiat
      ? formatNumberOrString({
          value: percentBelowClearing,
          type: NumberType.Percentage,
        })
      : '-'

    return {
      avgPriceDecimal: avgPriceInBidTokens,
      bidTokenSymbol: bidTokenInfo.symbol,
      avgPriceFiat: avgPriceFiatFormatted,
      fdvFromAvgPriceDisplay: `${fdvFromAvgPriceFormatted} ${t('stats.fdv')}`,
      percentBelowClearing: hasPriceFiat
        ? t('toucan.bidDetails.belowClearing', {
            percentage: percentBelowClearingFormatted,
          })
        : '-',
    }
  }, [
    auctionDetails.token,
    auctionDetails.tokenTotalSupply,
    bidTokenInfo.priceFiat,
    bidTokenInfo.symbol,
    clearingPriceDecimal,
    convertFiatAmountFormatted,
    filledBidAmount,
    formatNumberOrString,
    t,
    totalTokensReceived,
  ])

  return {
    displayState,
    spentAmount: filledBidAmount,
    maxBudgetAmount,
    spentFraction,
    refundBudgetAmount,
    refundBudgetLabel,
    refundBudgetSubtext,
    totalTokensReceivedDisplay,
    fdvFraction,
    maxFdvDisplay,
    currentFdvDisplay,
    buttonState,
    description,
    showUnusedBudgetCard,
    pricingCopy,
    filledPercentageDisplay,
    averagePriceData,
  }
}
