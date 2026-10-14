import { type UniverseChainId, Platform, type EVMUniverseChainId, areEvmAddressesEqual } from '@universe/chains'
import type { ColorTokens } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useEffect, useMemo } from 'react'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { zeroAddress } from '~/chains'
import {
  fromQ96ToDecimalWithTokenDecimals,
  q96ToPriceString,
} from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { type AuctionMaxBidPrice, useAuctionMaxBidPrice } from '~/features/Toucan/Auction/hooks/useAuctionMaxBidPrice'
import { type BudgetFieldState, useBidBudgetField } from '~/features/Toucan/Auction/hooks/useBidBudgetField'
import { type SubmitState, useBidFormSubmit } from '~/features/Toucan/Auction/hooks/useBidFormSubmit'
import {
  type MaxValuationFieldState,
  useBidMaxValuationField,
} from '~/features/Toucan/Auction/hooks/useBidMaxValuationField'
import { useCeilingRecap } from '~/features/Toucan/Auction/hooks/useCeilingRecap'
import { useDurationRemaining } from '~/features/Toucan/Auction/hooks/useDurationRemaining'
import { useIsQuickLaunchAuction } from '~/features/Toucan/Auction/hooks/useIsQuickLaunchAuction'
import { useMinValidBid } from '~/features/Toucan/Auction/hooks/useMinValidBid'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/features/Toucan/Auction/utils/clearingPrice'
import { approximateNumberFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { calculateQuickLaunchMaxBidQ96, snapToNearestTick } from '~/features/Toucan/Auction/utils/ticks'
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'

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
  maxPriceQ96: bigint | undefined
  bidTokenDecimals?: number
  hasBidToken: boolean
  bidCurrencyAddress?: string
  bidTokenSymbol: string
  isNativeBidToken: boolean
  maxBidPrice: AuctionMaxBidPrice
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
    totalCleared,
    floorPrice,
    tickSize,
    selectedTickPrice,
    totalSupply,
    auctionTokenDecimals,
    auctionTokenSymbol,
    auctionTokenName,
    auctionTokenAddress,
  } = useAuctionStore((state) => ({
    chainId: state.auctionDetails?.chainId,
    currency: state.auctionDetails?.currency,
    endBlock: state.auctionDetails?.endBlock,
    auctionContractAddress: state.auctionAddress,
    auctionDetails: state.auctionDetails,
    checkpointData: state.checkpointData,
    totalCleared: state.totalCleared,
    floorPrice: state.auctionDetails?.floorPrice,
    tickSize: state.auctionDetails?.tickSize,
    selectedTickPrice: state.selectedTickPrice,
    totalSupply: state.auctionDetails?.totalSupply,
    auctionTokenDecimals: getAuctionTokenDecimals(state.auctionDetails?.token),
    auctionTokenSymbol: state.auctionDetails?.token?.currency.symbol,
    auctionTokenName: state.auctionDetails?.token?.currency.name,
    auctionTokenAddress: state.auctionDetails?.tokenAddress,
  }))

  const clearingPrice = getClearingPrice(checkpointData, auctionDetails)

  const { setSelectedTickPrice, setUserBidPrice } = useAuctionStoreActions()

  const colors = useSporeColors()
  const glowColor = tokenColor ?? colors.surface1.val

  const accountAddress = useActiveAddress(Platform.EVM)
  const endBlockNum = endBlock ? Number(endBlock) : undefined
  const durationRemaining = useDurationRemaining(chainId as EVMUniverseChainId | undefined, endBlockNum)

  // Determine currency and balance
  const isNativeBidToken = areEvmAddressesEqual(currency, zeroAddress)

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

  // Auction-wide bid price ceiling from a maxBidPrice() validation hook, if any.
  const maxBidPrice = useAuctionMaxBidPrice({
    bidTokenDecimals,
    auctionTokenDecimals,
    clearingPriceQ96,
    floorPriceQ96,
    tickSizeQ96,
  })

  // QuickLaunch: no max-FDV input, so the bid uses the fixed product ceiling (the 25,000 ETH FDV
  // cap in ticks.ts, mirroring pools.trade / labs/rh-cca) instead of the min valid bid — the
  // order stays active through price discovery instead of silently dropping out.
  const isQuickLaunch = useIsQuickLaunchAuction()

  const quickLaunchMaxBidQ96 = useMemo(() => {
    // Falsy guards mirror useMinValidBid's; ticks.ts keeps its own tickSize <= 0n branch for
    // parity with the rh-cca source (independently unit-tested), it's just unreachable from here.
    if (!isQuickLaunch || !clearingPriceQ96 || !floorPriceQ96 || !tickSizeQ96) {
      return undefined
    }
    const unbounded = calculateQuickLaunchMaxBidQ96({ clearingPriceQ96, floorPriceQ96, tickSizeQ96 })
    // A quick launch hides the max-FDV input, so an over-ceiling peg would be a bid the
    // user can neither see nor correct — it would just revert on submission. Clamp to the
    // highest tick the hook accepts. When even that is exhausted the form is already
    // disabled by the reached state, so leaving the peg at the clamp is safe.
    const ceiling = maxBidPrice.maxValidBidQ96
    if (ceiling !== undefined && unbounded > ceiling) {
      return ceiling
    }
    return unbounded
  }, [isQuickLaunch, clearingPriceQ96, floorPriceQ96, tickSizeQ96, maxBidPrice.maxValidBidQ96])

  const quickLaunchMaxValuationDisplay = useMemo(() => {
    if (!quickLaunchMaxBidQ96 || bidTokenDecimals === undefined || auctionTokenDecimals === undefined) {
      return undefined
    }
    return q96ToPriceString({ q96Value: quickLaunchMaxBidQ96, bidTokenDecimals, auctionTokenDecimals })
  }, [quickLaunchMaxBidQ96, bidTokenDecimals, auctionTokenDecimals])

  // Quick launches fall back to the min valid bid while the ceiling inputs are still resolving,
  // so the field always initializes and Review bid never dead-ends with the input hidden.
  const defaultMaxValuationDisplay = useMemo(
    () => (isQuickLaunch ? (quickLaunchMaxValuationDisplay ?? minValidPriceDisplay) : minValidPriceDisplay) ?? '',
    [isQuickLaunch, quickLaunchMaxValuationDisplay, minValidPriceDisplay],
  )

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
    hasUserSetMaxValuation,
    applyTokenValueWithoutUserIntent,
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
    maxBidPriceQ96: maxBidPrice.maxBidPriceQ96,
    minValidPriceDisplay,
    minValidPriceDisplayFormatted,
    defaultMaxValuationDisplay,
    onInputChange,
  })

  // Anything entered before the ceiling resolved was capped against `undefined`, and this
  // field's write paths suppress the blur snap, so nothing else would correct it.
  useCeilingRecap({
    maxValidBidQ96: maxBidPrice.maxValidBidQ96,
    tokenValueQ96: maxValuationField.tokenValueQ96,
    tokenValue: maxValuationField.tokenValue,
    onRecap: applyTokenValueWithoutUserIntent,
  })

  // QuickLaunch: the max-valuation field is hidden, so keep it pegged to the ceiling.
  // The field only initializes its default once, and both the classification and the ceiling
  // (fixed at the FDV cap, but only computable once the auction's grid parameters load) resolve
  // asynchronously — without this the hidden field could stay at a stale (or min-valid) value.
  useEffect(() => {
    if (!isQuickLaunch || !quickLaunchMaxBidQ96 || !quickLaunchMaxValuationDisplay) {
      return
    }
    // Compare the FIELD's own value, never the submitted `maxPriceQ96`. Both the peg target
    // and maxPriceQ96 are clamped to the same ceiling tick, so comparing against the latter
    // reports "already pegged" the moment the ceiling resolves — and the write that would
    // bring the field's own (still unclamped) value into line never fires. The submitted
    // price would stay correct while `exactMaxValuationAmount` went stale for
    // evaluateMaxPrice and the analytics payload, on the one launch type where the field is
    // hidden and the user cannot see or fix it.
    //
    // tokenValueQ96 is that own value, unclamped. The exact-string check stays as the
    // write guard, so field-side normalization of the stored value cannot re-trigger the
    // write and loop the render.
    const isPegged =
      maxValuationField.tokenValueQ96 === quickLaunchMaxBidQ96 ||
      maxValuationField.tokenValue === quickLaunchMaxValuationDisplay
    if (!isPegged) {
      applyTokenValueWithoutUserIntent(quickLaunchMaxValuationDisplay)
    }
  }, [
    isQuickLaunch,
    quickLaunchMaxBidQ96,
    quickLaunchMaxValuationDisplay,
    maxValuationField,
    applyTokenValueWithoutUserIntent,
  ])

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
    const totalClearedRaw = totalCleared ? BigInt(totalCleared) : 0n
    const remainingRaw = totalSupplyRaw - totalClearedRaw
    const safeRemainingRaw = remainingRaw > 0n ? remainingRaw : 0n

    return approximateNumberFromRaw({
      raw: safeRemainingRaw,
      decimals: auctionTokenDecimals,
    })
  }, [auctionTokenDecimals, totalCleared, totalSupply])

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
    auctionTokenAddress,
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
      // QuickLaunch: no FDV input — ignore tick clicks instead of competing with the ceiling peg
      // (which would immediately revert them anyway), but still clear the selection.
      if (!isQuickLaunch) {
        // Use onTokenValueChange to set the token price directly
        // The chart tick represents the raw token price, and the display logic will
        // handle showing it as FDV in VALUATION mode or raw price in TOKEN_PRICE mode
        maxValuationField.onTokenValueChange(selectedTickPrice)
      }
      // Clear the selection after applying it
      setSelectedTickPrice(null)
    }
  }, [selectedTickPrice, maxValuationField, setSelectedTickPrice, isQuickLaunch])

  // Update the store's userBidPrice when max valuation changes
  // This allows the chart to display a bid line at the user's current bid position
  // We snap the price to the nearest tick to ensure the bid line always aligns with a valid tick,
  // even when fiat mode introduces floating-point precision errors during currency conversion
  useEffect(() => {
    // Only update if the user actually entered a max valuation (the field is pre-filled with a
    // default before any interaction, which must not render a bid indicator) and we have a valid,
    // non-zero max valuation and required parameters.
    // QuickLaunch: no bid line — the user never chose a max FDV, so drawing the synthetic
    // ceiling (the 25,000 ETH FDV cap) on the chart would only confuse.
    if (
      hasUserSetMaxValuation &&
      !isQuickLaunch &&
      maxPriceQ96 &&
      !maxPriceAmountIsZero &&
      !budgetAmountIsZero &&
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
    hasUserSetMaxValuation,
    maxPriceQ96,
    maxPriceAmountIsZero,
    isMaxPriceBelowMinimum,
    bidTokenDecimals,
    clearingPriceQ96,
    floorPriceQ96,
    tickSizeQ96,
    setUserBidPrice,
    budgetAmountIsZero,
    isQuickLaunch,
  ])

  return {
    budgetField,
    maxValuationField,
    submitState,
    durationRemaining,
    glowColor,
    auctionTokenDecimals,
    auctionTokenSymbol,
    auctionTokenName,
    expectedReceiveAmount,
    minExpectedReceiveAmount,
    maxReceivableAmount,
    maxPriceQ96,
    bidTokenDecimals,
    hasBidToken,
    bidCurrencyAddress: currency,
    bidTokenSymbol,
    isNativeBidToken,
    maxBidPrice,
  }
}
