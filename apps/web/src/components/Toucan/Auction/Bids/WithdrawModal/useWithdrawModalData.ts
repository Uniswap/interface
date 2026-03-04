import { useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { formatUnits } from 'viem'
import { fromQ96ToDecimalWithTokenDecimals } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { useBidTokenInfo } from '~/components/Toucan/Auction/hooks/useBidTokenInfo'
import { AuctionBidStatus, AuctionProgressState } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/components/Toucan/Auction/utils/clearingPrice'
import { approximateNumberFromRaw, computeFdvBidTokenRaw } from '~/components/Toucan/Auction/utils/fixedPointFdv'

interface UseWithdrawModalDataParams {
  bidId?: string
}

interface WithdrawModalData {
  // Raw values
  auctionTokensToClaim: bigint
  bidTokensToClaim: bigint
  // Formatted display values
  formattedAuctionTokens: string
  formattedBidTokens: string
  bidTokensFiatValue: string | null
  averageCostPerToken: string | null
  // Symbols
  auctionTokenSymbol: string | undefined
  bidTokenSymbol: string | undefined
  // Token logos
  auctionLogoUrl: Maybe<string>
  bidTokenLogoUrl: Maybe<string>
  // USD values (numeric, for analytics)
  auctionTokenAmountUsd: number | undefined
  bidTokenAmountUsd: number | undefined
  // Original bid budget (for analytics)
  budgetTokenAmountRaw: string | undefined
  budgetTokenAmountUsd: number | undefined
  maxFdvUsd: number | undefined
  // Chain info for logos
  chainId: number | undefined
  // Booleans for conditional rendering
  hasAuctionTokens: boolean
  hasBidTokens: boolean
  hasAnyTokens: boolean
  showPartialFillInfo: boolean
  // Auction state
  isAuctionEnded: boolean
}

/**
 * Hook that calculates and formats withdrawal modal display data
 * Handles the business logic for determining what tokens to show and their values
 */
export function useWithdrawModalData({ bidId }: UseWithdrawModalDataParams): WithdrawModalData {
  const { formatNumberOrString } = useLocalizationContext()

  // Get data from auction store
  const { userBids, auctionDetails, checkpointData, isGraduated, progressState } = useAuctionStore((state) => ({
    userBids: state.userBids,
    auctionDetails: state.auctionDetails,
    checkpointData: state.checkpointData,
    isGraduated: state.progress.isGraduated,
    progressState: state.progress.state,
  }))

  // Get bid token info
  const { bidTokenInfo } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId,
  })

  // Get auction token currency info and market price
  const auctionTokenCurrencyId = useMemo(
    () =>
      auctionDetails?.chainId && auctionDetails.tokenAddress
        ? buildCurrencyId(auctionDetails.chainId, auctionDetails.tokenAddress)
        : undefined,
    [auctionDetails?.chainId, auctionDetails?.tokenAddress],
  )

  const auctionTokenCurrencyInfo = useCurrencyInfo(auctionTokenCurrencyId)
  const auctionTokenCurrency = auctionTokenCurrencyInfo?.currency

  // Fetch auction token market price
  const { price: auctionTokenUsdcPrice } = useUSDCPrice(auctionTokenCurrency)

  // Convert to numeric USD value
  const auctionTokenPriceFiat = useMemo(() => {
    if (!auctionTokenUsdcPrice) {
      return undefined
    }
    try {
      return Number(auctionTokenUsdcPrice.toSignificant(18))
    } catch {
      return undefined
    }
  }, [auctionTokenUsdcPrice])

  // Filter bids when bidId is provided for individual bid operations
  const targetBids = useMemo(() => {
    if (bidId) {
      return userBids.filter((b) => b.bidId === bidId)
    }
    return userBids
  }, [userBids, bidId])

  // Calculate auction tokens to claim (tokens filled from auction)
  // Only applicable when auction is graduated - sum of UserBid `amount` where status != 'claimed'
  const auctionTokensToClaim = useMemo(() => {
    if (!isGraduated) {
      return 0n
    }
    return targetBids.reduce((acc, bid) => {
      if (bid.status !== AuctionBidStatus.Claimed) {
        return acc + BigInt(bid.amount)
      }
      return acc
    }, 0n)
  }, [targetBids, isGraduated])

  // Calculate bid tokens to refund
  // - If NOT graduated: Full refund of baseTokenInitial (entire bid amount)
  // - If graduated: Partial refund of unused budget (baseTokenInitial - currencySpent)
  const bidTokensToClaim = useMemo(() => {
    return targetBids.reduce((acc, bid) => {
      if (bid.status === AuctionBidStatus.Submitted) {
        if (!isGraduated) {
          return acc + BigInt(bid.baseTokenInitial)
        } else {
          const unusedBudget = BigInt(bid.baseTokenInitial) - BigInt(bid.currencySpent)
          return acc + unusedBudget
        }
      }
      return acc
    }, 0n)
  }, [targetBids, isGraduated])

  // Calculate currency spent for non-claimed bids (for average cost calculation)
  const currencySpentForAuctionTokens = useMemo(() => {
    return targetBids.reduce((acc, bid) => {
      if (bid.status !== AuctionBidStatus.Claimed) {
        return acc + BigInt(bid.currencySpent)
      }
      return acc
    }, 0n)
  }, [targetBids])

  // Format auction tokens for display
  const formattedAuctionTokens = useMemo(() => {
    if (!auctionDetails?.token?.currency.decimals) {
      return '0'
    }
    const decimal = formatUnits(auctionTokensToClaim, auctionDetails.token.currency.decimals)
    return formatNumberOrString({ value: decimal, type: NumberType.TokenNonTx })
  }, [auctionTokensToClaim, auctionDetails, formatNumberOrString])

  // Format bid tokens for display
  const formattedBidTokens = useMemo(() => {
    if (!bidTokenInfo?.decimals || !bidTokenInfo.symbol) {
      return '0'
    }
    const decimal = formatUnits(bidTokensToClaim, bidTokenInfo.decimals)
    return `${formatNumberOrString({ value: decimal, type: NumberType.TokenNonTx })} ${bidTokenInfo.symbol}`
  }, [bidTokensToClaim, bidTokenInfo, formatNumberOrString])

  // Calculate fiat value of bid tokens (formatted string for display)
  const bidTokensFiatValue = useMemo(() => {
    if (!bidTokenInfo?.decimals || !bidTokenInfo.priceFiat || bidTokensToClaim === 0n) {
      return null
    }
    const decimal = Number(formatUnits(bidTokensToClaim, bidTokenInfo.decimals))
    const fiatValue = decimal * bidTokenInfo.priceFiat
    return formatNumberOrString({ value: fiatValue.toString(), type: NumberType.FiatTokenQuantity })
  }, [bidTokensToClaim, bidTokenInfo, formatNumberOrString])

  // Calculate numeric USD value of bid tokens (for analytics)
  const bidTokenAmountUsd = useMemo(() => {
    if (!bidTokenInfo?.decimals || !bidTokenInfo.priceFiat || bidTokensToClaim === 0n) {
      return undefined
    }
    const decimal = Number(formatUnits(bidTokensToClaim, bidTokenInfo.decimals))
    return decimal * bidTokenInfo.priceFiat
  }, [bidTokensToClaim, bidTokenInfo])

  // Calculate numeric USD value of auction tokens (for analytics)
  // Uses hybrid approach: market price first, then clearing price fallback
  const auctionTokenAmountUsd = useMemo(() => {
    if (!auctionDetails?.token?.currency.decimals || auctionTokensToClaim === 0n) {
      return undefined
    }

    const auctionTokensDecimal = Number(formatUnits(auctionTokensToClaim, auctionDetails.token.currency.decimals))

    if (auctionTokenPriceFiat !== undefined) {
      return auctionTokensDecimal * auctionTokenPriceFiat
    }

    if (!bidTokenInfo?.decimals || !bidTokenInfo.priceFiat) {
      return undefined
    }

    const clearingPriceQ96 = getClearingPrice(checkpointData, auctionDetails)
    if (!clearingPriceQ96 || clearingPriceQ96 === '0') {
      return undefined
    }

    const clearingPriceDecimal = fromQ96ToDecimalWithTokenDecimals({
      q96Value: clearingPriceQ96,
      bidTokenDecimals: bidTokenInfo.decimals,
      auctionTokenDecimals: auctionDetails.token.currency.decimals,
    })

    // Formula: auction_tokens × clearing_price × bid_token_usd_price
    return auctionTokensDecimal * clearingPriceDecimal * bidTokenInfo.priceFiat
  }, [auctionTokensToClaim, auctionDetails, checkpointData, bidTokenInfo, auctionTokenPriceFiat])

  // Calculate average cost per auction token
  const averageCostPerToken = useMemo(() => {
    if (auctionTokensToClaim === 0n || !auctionDetails?.token?.currency.decimals || !bidTokenInfo?.decimals) {
      return null
    }

    const auctionTokensDecimal = Number(formatUnits(auctionTokensToClaim, auctionDetails.token.currency.decimals))
    const currencySpentDecimal = Number(formatUnits(currencySpentForAuctionTokens, bidTokenInfo.decimals))

    if (auctionTokensDecimal === 0) {
      return null
    }

    const avgCost = currencySpentDecimal / auctionTokensDecimal
    return formatNumberOrString({ value: avgCost.toString(), type: NumberType.TokenNonTx })
  }, [auctionTokensToClaim, currencySpentForAuctionTokens, auctionDetails, bidTokenInfo, formatNumberOrString])

  const hasAuctionTokens = auctionTokensToClaim > 0n
  const hasBidTokens = bidTokensToClaim > 0n
  const hasAnyTokens = hasAuctionTokens || hasBidTokens
  // Only show partial fill info when auction graduated and there are unused bid tokens to refund.
  // For non-graduated auctions, users get a full refund (not a partial fill).
  const showPartialFillInfo = hasBidTokens && isGraduated

  // Calculate original budget amounts (sum of all target bids' baseTokenInitial)
  const { budgetTokenAmountRaw, budgetTokenAmountUsd } = useMemo(() => {
    if (targetBids.length === 0 || !bidTokenInfo?.priceFiat) {
      return { budgetTokenAmountRaw: undefined, budgetTokenAmountUsd: undefined }
    }

    // Sum up all baseTokenInitial values from target bids
    const totalBudgetRaw = targetBids.reduce((sum, bid) => {
      return sum + BigInt(bid.baseTokenInitial)
    }, 0n)

    const budgetRaw = totalBudgetRaw.toString()

    // Convert to decimal for USD calculation
    const budgetDecimal = Number(formatUnits(totalBudgetRaw, bidTokenInfo.decimals))
    const budgetUsd = budgetDecimal * bidTokenInfo.priceFiat

    return {
      budgetTokenAmountRaw: budgetRaw,
      budgetTokenAmountUsd: budgetUsd,
    }
  }, [targetBids, bidTokenInfo])

  // Calculate max FDV USD for analytics
  const maxFdvUsd = useMemo(() => {
    if (!auctionDetails?.tokenTotalSupply || !bidTokenInfo?.priceFiat || targetBids.length === 0) {
      return undefined
    }

    const auctionTokenDecimals = auctionDetails.token?.currency.decimals
    if (auctionTokenDecimals === undefined) {
      return undefined
    }

    // Use maxPrice from the first target bid as an approximation for the max FDV
    const bid = targetBids[0]

    // Calculate max FDV in bid token raw units
    const maxFdvBidTokenRaw = computeFdvBidTokenRaw({
      priceQ96: bid.maxPrice,
      bidTokenDecimals: bidTokenInfo.decimals,
      totalSupplyRaw: auctionDetails.tokenTotalSupply,
      auctionTokenDecimals,
    })

    // Convert to approximate decimal number
    const maxFdvDecimal = approximateNumberFromRaw({
      raw: maxFdvBidTokenRaw,
      decimals: bidTokenInfo.decimals,
    })

    // Convert to USD
    return maxFdvDecimal * bidTokenInfo.priceFiat
  }, [auctionDetails, bidTokenInfo, targetBids])

  return {
    auctionLogoUrl: auctionDetails?.token?.logoUrl,
    auctionTokensToClaim,
    bidTokensToClaim,
    formattedAuctionTokens,
    formattedBidTokens,
    bidTokensFiatValue,
    averageCostPerToken,
    auctionTokenSymbol: auctionDetails?.token?.currency.symbol,
    bidTokenSymbol: bidTokenInfo?.symbol,
    bidTokenLogoUrl: bidTokenInfo?.logoUrl,
    auctionTokenAmountUsd,
    bidTokenAmountUsd,
    budgetTokenAmountRaw,
    budgetTokenAmountUsd,
    maxFdvUsd,
    chainId: auctionDetails?.chainId,
    hasAuctionTokens,
    hasBidTokens,
    hasAnyTokens,
    showPartialFillInfo,
    isAuctionEnded: progressState === AuctionProgressState.ENDED,
  }
}
