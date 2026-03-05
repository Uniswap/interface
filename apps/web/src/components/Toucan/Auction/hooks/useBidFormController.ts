import { useEffect, useMemo } from 'react'
import { ColorTokens, useSporeColors } from 'ui/src'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { zeroAddress } from 'viem'
import { fromQ96ToDecimalWithTokenDecimals } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { BudgetFieldState, useBidBudgetField } from '~/components/Toucan/Auction/hooks/useBidBudgetField'
import { SubmitState, useBidFormSubmit } from '~/components/Toucan/Auction/hooks/useBidFormSubmit'
import {
  MaxValuationFieldState,
  useBidMaxValuationField,
} from '~/components/Toucan/Auction/hooks/useBidMaxValuationField'
import { useDurationRemaining } from '~/components/Toucan/Auction/hooks/useDurationRemaining'
import { useMinValidBid } from '~/components/Toucan/Auction/hooks/useMinValidBid'
import { useAuctionStore, useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/components/Toucan/Auction/utils/clearingPrice'
import { approximateNumberFromRaw } from '~/components/Toucan/Auction/utils/fixedPointFdv'
import { snapToNearestTick } from '~/components/Toucan/Auction/utils/ticks'

interface UseBidFormControllerResult {
  budgetField: BudgetFieldState
  maxValuationField: MaxValuationFieldState
  submitState: SubmitState
  durationRemaining: string | undefined
  glowColor: string
  totalSupply?: string
  auctionTokenDecimals?: number
  auctionTokenSymbol?: string
  auctionTokenName?: string
  expectedReceiveAmount?: number
  minExpectedReceiveAmount?: number
  maxReceivableAmount?: number
  hasBidToken: boolean
  bidCurrencyAddress?: string
  bidTokenSymbol: string
  isNativeBidToken: boolean
}

interface UseBidFormControllerParams {
  tokenColor?: ColorTokens
  onTransactionSubmitted?: () => void
  onInputChange?: () => void
}

export function useBidFormController({
  tokenColor,
  onTransactionSubmitted,
  onInputChange,
}: UseBidFormControllerParams): UseBidFormControllerResult {
  // Gather shared auction data
  const {
    chainId,
    currency,
    endBlock,
    auctionContractAddress,
    auctionDetails,
    checkpointData,
    floorPrice,
    tickSize,
    selectedTickPrice,
    totalSupply,
    auctionTokenDecimals,
    auctionTokenSymbol,
    auctionTokenName,
  } = useAuctionStore((state) => ({
    chainId: state.auctionDetails?.chainId,
    currency: state.auctionDetails?.currency,
    endBlock: state.auctionDetails?.endBlock,
    auctionContractAddress: state.auctionAddress,
    auctionDetails: state.auctionDetails,
    checkpointData: state.checkpointData,
    floorPrice: state.auctionDetails?.floorPrice,
    tickSize: state.auctionDetails?.tickSize,
    selectedTickPrice: state.selectedTickPrice,
    totalSupply: state.auctionDetails?.totalSupply,
    auctionTokenDecimals: state.auctionDetails?.token?.currency.decimals,
    auctionTokenSymbol: state.auctionDetails?.token?.currency.symbol,
    auctionTokenName: state.auctionDetails?.token?.currency.name,
  }))

  const clearingPrice = getClearingPrice(checkpointData, auctionDetails)

  const { setSelectedTickPrice, setUserBidPrice } = useAuctionStoreActions()

  const colors = useSporeColors()
  const glowColor = tokenColor ?? colors.surface1.val

  const accountAddress = useActiveAddress(Platform.EVM)
  const endBlockNum = endBlock ? Number(endBlock) : undefined
  const durationRemaining = useDurationRemaining(chainId as EVMUniverseChainId | undefined, endBlockNum)

  // Determine currency and balance
  const isNativeBidToken = currency?.toLowerCase() === zeroAddress

  const bidCurrencyId = useMemo(() => {
    if (!chainId) {
      return undefined
    }

    if (isNativeBidToken) {
      return buildNativeCurrencyId(chainId as UniverseChainId)
    }

    if (!currency) {
      return undefined
    }

    return buildCurrencyId(chainId as UniverseChainId, currency)
  }, [currency, chainId, isNativeBidToken])

  const nativeCurrencyId = useMemo(() => {
    if (!chainId) {
      return undefined
    }

    return buildNativeCurrencyId(chainId as UniverseChainId)
  }, [chainId])
  const nativeCurrencyInfo = useCurrencyInfo(nativeCurrencyId)
  const queriedCurrencyInfo = useCurrencyInfo(bidCurrencyId)
  const currencyInfo = isNativeBidToken ? nativeCurrencyInfo : queriedCurrencyInfo
  const bidCurrency = currencyInfo?.currency
  const { balance: currencyBalance } = useOnChainCurrencyBalance(bidCurrency, accountAddress)

  // Compute Q96 values for price calculations
  const bidTokenDecimals = bidCurrency?.decimals
  const bidTokenSymbol = bidCurrency?.symbol ?? currencyInfo?.currency.symbol ?? ''

  const tickSizeQ96 = useMemo(() => (tickSize ? BigInt(tickSize) : undefined), [tickSize])
  const clearingPriceQ96 = useMemo(() => (clearingPrice ? BigInt(clearingPrice) : undefined), [clearingPrice])
  const floorPriceQ96 = useMemo(() => (floorPrice ? BigInt(floorPrice) : undefined), [floorPrice])

  // Use the centralized hook to calculate minimum valid bid according to contract rules
  const {
    minValidBidQ96: minMaxPriceQ96,
    minValidBidDisplay: minValidPriceDisplay,
    minValidBidFormatted: minValidPriceDisplayFormatted,
  } = useMinValidBid({
    clearingPriceQ96,
    floorPriceQ96,
    tickSizeQ96,
    bidTokenDecimals,
    auctionTokenDecimals,
  })

  const defaultMaxValuationDisplay = useMemo(() => minValidPriceDisplay ?? '', [minValidPriceDisplay])

  // Initialize budget field hook
  const { budgetField, budgetCurrencyAmount, budgetAmountIsZero, resetBudgetField } = useBidBudgetField({
    bidCurrency,
    currencyBalance,
    currencyInfo,
    onInputChange,
  })

  // Initialize max valuation field hook
  const {
    maxValuationField,
    exactMaxValuationAmount,
    maxPriceAmountIsZero,
    maxPriceQ96,
    isMaxPriceBelowMinimum,
    setMaxPriceError,
    evaluateMaxPrice,
    resetMaxValuationField,
  } = useBidMaxValuationField({
    bidCurrency,
    currencyBalance,
    currencyInfo,
    bidTokenDecimals,
    auctionTokenDecimals,
    bidTokenSymbol,
    clearingPriceQ96,
    floorPriceQ96,
    tickSizeQ96,
    minMaxPriceQ96,
    minValidPriceDisplay,
    minValidPriceDisplayFormatted,
    defaultMaxValuationDisplay,
    onInputChange,
  })

  // Check if user has any balance of the bid token
  const hasBidToken = Boolean(currencyBalance && !currencyBalance.equalTo(0))

  // Check if budget exceeds balance
  const exceedsBalance = Boolean(
    currencyBalance && budgetCurrencyAmount && currencyBalance.lessThan(budgetCurrencyAmount),
  )

  const expectedReceiveAmount = useMemo(() => {
    if (!budgetField.currencyAmount || !clearingPriceQ96) {
      return undefined
    }

    const budgetVal = parseFloat(budgetField.currencyAmount.toExact())
    const priceVal = fromQ96ToDecimalWithTokenDecimals({
      q96Value: clearingPriceQ96,
      bidTokenDecimals,
      auctionTokenDecimals,
    })

    if (priceVal === 0) {
      return undefined
    }

    return budgetVal / priceVal
  }, [auctionTokenDecimals, bidTokenDecimals, budgetField.currencyAmount, clearingPriceQ96])

  // Minimum expected tokens = budget / max price (worst case if clearing price rises to max)
  const minExpectedReceiveAmount = useMemo(() => {
    if (!budgetField.currencyAmount || !maxPriceQ96) {
      return undefined
    }

    const budgetVal = parseFloat(budgetField.currencyAmount.toExact())
    const maxPriceVal = fromQ96ToDecimalWithTokenDecimals({
      q96Value: maxPriceQ96,
      bidTokenDecimals,
      auctionTokenDecimals,
    })

    if (maxPriceVal === 0) {
      return undefined
    }

    return budgetVal / maxPriceVal
  }, [auctionTokenDecimals, bidTokenDecimals, budgetField.currencyAmount, maxPriceQ96])

  const maxReceivableAmount = useMemo(() => {
    if (!totalSupply || auctionTokenDecimals === undefined) {
      return undefined
    }

    const totalSupplyRaw = BigInt(totalSupply)
    const totalClearedRaw = checkpointData?.totalCleared ? BigInt(checkpointData.totalCleared) : 0n
    const remainingRaw = totalSupplyRaw - totalClearedRaw
    const safeRemainingRaw = remainingRaw > 0n ? remainingRaw : 0n

    return approximateNumberFromRaw({
      raw: safeRemainingRaw,
      decimals: auctionTokenDecimals,
    })
  }, [auctionTokenDecimals, checkpointData?.totalCleared, totalSupply])

  // Initialize submit hook
  const { submitState } = useBidFormSubmit({
    evaluateMaxPrice,
    exactMaxValuationAmount,
    setExactMaxValuationAmount: maxValuationField.onChange,
    setMaxPriceError,
    budgetCurrencyAmount,
    accountAddress,
    auctionContractAddress,
    chainId,
    isNativeBidToken,
    currency,
    resetBudgetField,
    resetMaxValuationField,
    budgetAmountIsZero,
    maxPriceAmountIsZero,
    exceedsBalance,
    isMaxPriceBelowMinimum,
    bidTokenDecimals,
    maxPriceQ96,
    onTransactionSubmitted,
    budgetAmountUsd: budgetField.usdValue ? parseFloat(budgetField.usdValue.toExact()) : undefined,
    maxFdvUsd: maxValuationField.usdValue ? parseFloat(maxValuationField.usdValue.toExact()) : undefined,
    pricePerToken: maxValuationField.tokenValue ? parseFloat(maxValuationField.tokenValue) : undefined,
    expectedReceiveAmount,
    minExpectedReceiveAmount,
    maxReceivableAmount,
    auctionTokenSymbol,
    auctionTokenName,
  })

  // Listen for chart tick clicks and update max valuation field
  useEffect(() => {
    if (selectedTickPrice) {
      // Use onTokenValueChange to set the token price directly
      // The chart tick represents the raw token price, and the display logic will
      // handle showing it as FDV in VALUATION mode or raw price in TOKEN_PRICE mode
      maxValuationField.onTokenValueChange(selectedTickPrice)
      // Clear the selection after applying it
      setSelectedTickPrice(null)
    }
  }, [selectedTickPrice, maxValuationField, setSelectedTickPrice])

  // Update the store's userBidPrice when max valuation changes
  // This allows the chart to display a bid line at the user's current bid position
  // We snap the price to the nearest tick to ensure the bid line always aligns with a valid tick,
  // even when fiat mode introduces floating-point precision errors during currency conversion
  useEffect(() => {
    // Only update if we have a valid, non-zero max valuation and required parameters
    if (
      maxPriceQ96 &&
      !maxPriceAmountIsZero &&
      !isMaxPriceBelowMinimum &&
      bidTokenDecimals !== undefined &&
      clearingPriceQ96 &&
      floorPriceQ96 &&
      tickSizeQ96
    ) {
      // Snap the Q96 value to the nearest tick to handle fiat conversion precision errors
      const snappedQ96 = snapToNearestTick({
        value: maxPriceQ96,
        floorPrice: floorPriceQ96,
        clearingPrice: clearingPriceQ96,
        tickSize: tickSizeQ96,
      })
      // Convert the snapped Q96 value back to a decimal for the chart
      // IMPORTANT: Use fromQ96ToDecimalWithTokenDecimals to match how bar tick values are computed
      // Both the bid line and bid dot rely on this value matching the bar tickValue for alignment
      const snappedPriceDecimal = fromQ96ToDecimalWithTokenDecimals({
        q96Value: snappedQ96,
        bidTokenDecimals,
        auctionTokenDecimals,
      })
      setUserBidPrice(snappedPriceDecimal.toString())
    } else {
      // Clear the bid line when there's no valid bid
      setUserBidPrice(null)
    }
  }, [
    auctionTokenDecimals,
    maxPriceQ96,
    maxPriceAmountIsZero,
    isMaxPriceBelowMinimum,
    bidTokenDecimals,
    clearingPriceQ96,
    floorPriceQ96,
    tickSizeQ96,
    setUserBidPrice,
  ])

  return {
    budgetField,
    maxValuationField,
    submitState,
    durationRemaining,
    glowColor,
    totalSupply,
    auctionTokenDecimals,
    auctionTokenSymbol,
    auctionTokenName,
    expectedReceiveAmount,
    minExpectedReceiveAmount,
    maxReceivableAmount,
    hasBidToken,
    bidCurrencyAddress: currency,
    bidTokenSymbol,
    isNativeBidToken,
  }
}
