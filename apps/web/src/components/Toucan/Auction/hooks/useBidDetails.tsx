import { type ReactNode, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { formatUnits } from 'viem'
import { q96ToPriceString } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import {
  AuctionBidStatus,
  AuctionDetails,
  AuctionProgressState,
  BidTokenInfo,
  UserBid,
} from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import {
  type BidDisplayState,
  computeIsFullyFilled,
  formatTokenAmountWithSubscript,
  getBidDisplayInfo,
} from '~/components/Toucan/Auction/utils/bidDetails'
import { calculateBidFillFraction } from '~/components/Toucan/Auction/utils/calculateBidFillFraction'
import {
  approximateNumberFromRaw,
  computeFdvBidTokenRaw,
  computeFractionFromRaw,
  formatCompactFromRaw,
} from '~/components/Toucan/Auction/utils/fixedPointFdv'

// Module-level constant for description highlighting (no deps, never changes)
const HIGHLIGHT_COMPONENT = <Text variant="body4" color="$neutral1" />

interface UseBidDetailsParams {
  bid: UserBid
  isInRange: boolean
  bidTokenInfo: BidTokenInfo
  auctionDetails: AuctionDetails
  clearingPrice: string
  isGraduated: boolean
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
  fdvFraction: number
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
  isGraduated,
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

  // Use unified getBidDisplayInfo for all display state derivation
  const { displayState, descriptionState } = useMemo(
    () =>
      getBidDisplayInfo({
        bidStatus: bid.status,
        isInRange,
        isFullyFilled,
        auctionProgressState,
        isGraduated,
        isInPreClaimWindow,
      }),
    [bid.status, isInRange, isFullyFilled, auctionProgressState, isGraduated, isInPreClaimWindow],
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
    const decimals = auctionDetails.token?.currency.decimals
    if (decimals === undefined) {
      return 0
    }
    return Number(formatUnits(BigInt(bid.amount), decimals))
  }, [auctionDetails.token?.currency.decimals, bid.amount])

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
    const auctionTokenDecimals = auctionDetails.token?.currency.decimals ?? 18
    const priceString = q96ToPriceString({
      q96Value: clearingPrice,
      bidTokenDecimals: bidTokenInfo.decimals,
      auctionTokenDecimals,
    })
    const parsed = Number.parseFloat(priceString)
    return Number.isFinite(parsed) ? parsed : 0
  }, [auctionDetails.token?.currency.decimals, bidTokenInfo.decimals, clearingPrice])

  const { fdvFraction, maxFdvBidTokenRaw, currentFdvBidTokenRaw } = useMemo(() => {
    const auctionTokenDecimals = auctionDetails.token?.currency.decimals ?? 18
    const totalSupplyRaw = auctionDetails.tokenTotalSupply

    if (!totalSupplyRaw || totalSupplyRaw === '0') {
      return { fdvFraction: 0, maxFdvBidTokenRaw: 0n, currentFdvBidTokenRaw: 0n }
    }

    const maxFdvBidTokenRaw = computeFdvBidTokenRaw({
      priceQ96: bid.maxPrice,
      bidTokenDecimals: bidTokenInfo.decimals,
      totalSupplyRaw,
      auctionTokenDecimals,
    })

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
  }, [
    clearingPrice,
    auctionDetails.token?.currency.decimals,
    auctionDetails.tokenTotalSupply,
    bid.maxPrice,
    bidTokenInfo.decimals,
  ])

  const maxFdvDisplay = useMemo(() => {
    const formatted = formatCompactFromRaw({ raw: maxFdvBidTokenRaw, decimals: bidTokenInfo.decimals })
    return `${formatted} ${bidTokenInfo.symbol}`
  }, [bidTokenInfo.decimals, bidTokenInfo.symbol, maxFdvBidTokenRaw])

  const currentFdvDisplay = useMemo(() => {
    const formatted = formatCompactFromRaw({ raw: currentFdvBidTokenRaw, decimals: bidTokenInfo.decimals })
    return `${formatted} ${bidTokenInfo.symbol}`
  }, [bidTokenInfo.decimals, bidTokenInfo.symbol, currentFdvBidTokenRaw])

  // ─────────────────────────────────────────────────────────────────
  // Button State & UI Logic
  // ─────────────────────────────────────────────────────────────────
  const buttonState = useMemo<ButtonState>(() => {
    const isAuctionInProgress = auctionProgressState === AuctionProgressState.IN_PROGRESS
    const isAuctionEnded = auctionProgressState === AuctionProgressState.ENDED

    // Auction over - hide button UNLESS we're in the pre-claim window
    // for a graduated auction with out-of-range bids (allow exit during this window)
    if (isAuctionEnded) {
      // Allow refund button during pre-claim window for graduated auctions with out-of-range bids
      if (isGraduated && isInPreClaimWindow && !isInRange) {
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

    // State 3: In progress + out of range + graduated
    if (isAuctionInProgress && !isInRange && isGraduated) {
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
    isGraduated,
    isInPreClaimWindow,
    isInRange,
    isExited,
    pendingWithdrawalBidIds,
    t,
  ])

  const description = useMemo<ReactNode>(() => {
    const components = { highlight: HIGHLIGHT_COMPONENT }
    const tokenSymbol = auctionDetails.token?.currency.symbol
    const valuationSummary = maxFdvDisplay

    switch (descriptionState) {
      case 'overNotGraduated':
        return <Trans i18nKey="toucan.bidDetails.description.overNotGraduated" components={components} />
      case 'overNotGraduatedExited':
        return <Trans i18nKey="toucan.bidDetails.description.overNotGraduatedExited" components={components} />
      case 'completeInProgress':
        return <Trans i18nKey="toucan.bidDetails.description.completeInProgress" components={components} />
      case 'completePreClaim':
        return <Trans i18nKey="toucan.bidDetails.description.completePreClaim" components={components} />
      case 'completeOver':
        return <Trans i18nKey="toucan.bidDetails.description.completeOver" components={components} />
      case 'completeClaimed':
        return <Trans i18nKey="toucan.bidDetails.description.completeClaimed" components={components} />
      case 'inRangeInProgress':
        return (
          <Trans
            i18nKey="toucan.bidDetails.description.inRangeInProgress"
            values={{ tokenSymbol, valuationSummary }}
            components={components}
          />
        )
      case 'inRangePreClaim':
        return <Trans i18nKey="toucan.bidDetails.description.inRangePreClaim" components={components} />
      case 'inRangeOver':
        return <Trans i18nKey="toucan.bidDetails.description.inRangeOver" components={components} />
      case 'inRangeOutOfRangeClaimed':
        return <Trans i18nKey="toucan.bidDetails.description.inRangeOutOfRangeClaimed" components={components} />
      case 'outOfRangeInProgress':
        return (
          <Trans
            i18nKey="toucan.bidDetails.description.outOfRangeInProgress"
            values={{ valuationSummary }}
            components={components}
          />
        )
      case 'outOfRangePreClaim':
        return <Trans i18nKey="toucan.bidDetails.description.outOfRangePreClaim" components={components} />
      case 'outOfRangePreClaimExited':
        return <Trans i18nKey="toucan.bidDetails.description.outOfRangePreClaimExited" components={components} />
      case 'outOfRangeOver':
        return <Trans i18nKey="toucan.bidDetails.description.outOfRangeOver" components={components} />
      case 'outOfRangeOverExited':
        return <Trans i18nKey="toucan.bidDetails.description.outOfRangeOverExited" components={components} />
      default:
        return null
    }
  }, [descriptionState, maxFdvDisplay, auctionDetails.token?.currency.symbol])

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
    const auctionTokenDecimals = auctionDetails.token?.currency.decimals ?? 18
    const totalSupplyRaw = auctionDetails.tokenTotalSupply
    let fdvFromAvgPriceFormatted = '-'

    if (hasPriceFiat && totalSupplyRaw && totalSupplyRaw !== '0') {
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
    auctionDetails.token?.currency.decimals,
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
