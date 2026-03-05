import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { NumberType } from 'utilities/src/format/types'
import { fromQ96ToDecimalWithTokenDecimals } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { PreparedBidTransaction, SubmitState } from '~/components/Toucan/Auction/hooks/useBidFormSubmit'
import { useFormattedGasFee } from '~/components/Toucan/Auction/hooks/useFormattedGasFee'
import { useMinValidBid } from '~/components/Toucan/Auction/hooks/useMinValidBid'
import {
  approximateNumberFromRaw,
  computeFdvBidTokenRaw,
  formatCompactFromRaw,
} from '~/components/Toucan/Auction/utils/fixedPointFdv'
import { useTransactionGasFee } from '~/hooks/useTransactionGasFee'

interface UseBidReviewDataParams {
  isOpen: boolean
  submitState: SubmitState
  budgetAmount: CurrencyAmount<Currency> | undefined
  maxValuationAmount: CurrencyAmount<Currency> | undefined
  budgetSymbol: string
  auctionChainId: number | undefined
  auctionAddress: string | undefined
  shouldEstimateGas: boolean
  clearingPriceQ96: bigint | undefined
  floorPriceQ96: bigint | undefined
  tickSizeQ96: bigint | undefined
  fallbackBidTokenDecimals: number | undefined
  totalSupply: string | undefined
  auctionTokenDecimals: number | undefined
  bidTokenPriceFiat: number | undefined
}

interface BidReviewData {
  preparedBid: PreparedBidTransaction | undefined
  isPreparing: boolean
  preparationError: Error | undefined
  /** Decimal value of the max price per token for SubscriptZeroPrice component */
  maxPricePerTokenDecimal: number | undefined
  /** Max FDV formatted in bid token (e.g., "470.7k ETH") */
  maxFdvFormatted: string | undefined
  /** Max FDV formatted in fiat (e.g., "$1.5B") */
  maxFdvFiatFormatted: string | undefined
  /** Max FDV raw value for legal text (precise format like "470,769.97 ETH") */
  maxFdvPreciseFormatted: string | undefined
  isPriceBelowClearing: boolean
  formattedGasFee: string | undefined
  isConfirmDisabled: boolean
  retryPreparation: () => void
  /** Minimum valid bid display value (for setting min bid on retry) */
  minValidBidDisplay: string | undefined
}

export function useBidReviewData({
  isOpen,
  submitState,
  budgetAmount,
  maxValuationAmount,
  budgetSymbol,
  auctionChainId,
  auctionAddress,
  shouldEstimateGas,
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
  fallbackBidTokenDecimals,
  totalSupply,
  auctionTokenDecimals,
  bidTokenPriceFiat,
}: UseBidReviewDataParams): BidReviewData {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const [preparedBid, setPreparedBid] = useState<PreparedBidTransaction | undefined>()
  const [isPreparing, setIsPreparing] = useState(false)
  const [preparationError, setPreparationError] = useState<Error | undefined>()
  const [retryTrigger, setRetryTrigger] = useState(0)

  // Capture the values when the modal opens to prevent re-triggering preparation
  // when form values change while the modal is open
  const [capturedBudgetRawAmount, setCapturedBudgetRawAmount] = useState<string | undefined>()
  const [capturedMaxValuationRawAmount, setCapturedMaxValuationRawAmount] = useState<string | undefined>()
  const hasCapturedRef = useRef(false)

  const budgetRawAmount = budgetAmount?.quotient.toString()
  const maxValuationRawAmount = maxValuationAmount?.quotient.toString()

  // Capture values ONLY once when modal opens
  useEffect(() => {
    if (isOpen && !hasCapturedRef.current && budgetRawAmount && maxValuationRawAmount) {
      // Modal just opened and we have values - capture them
      setCapturedBudgetRawAmount(budgetRawAmount)
      setCapturedMaxValuationRawAmount(maxValuationRawAmount)
      hasCapturedRef.current = true
    }
    if (!isOpen && hasCapturedRef.current) {
      // Modal closed - clear captured values and reset flag
      setCapturedBudgetRawAmount(undefined)
      setCapturedMaxValuationRawAmount(undefined)
      hasCapturedRef.current = false
    }
  }, [isOpen, budgetRawAmount, maxValuationRawAmount])

  const normalizedChainId = useMemo(() => {
    if (!auctionChainId) {
      return undefined
    }
    return auctionChainId as UniverseChainId
  }, [auctionChainId])

  // Fallback to mainnet for hook call since hooks can't be conditional.
  // gasFeeCurrencyAmount check below guards against using wrong chain's native currency.
  const nativeCurrencyInfo = useNativeCurrencyInfo(normalizedChainId ?? UniverseChainId.Mainnet)

  // Clear state when modal closes so it re-fires when reopened
  useEffect(() => {
    if (!isOpen) {
      setPreparedBid(undefined)
      setPreparationError(undefined)
      setIsPreparing(false)
    }
  }, [isOpen])

  // Prepare transaction when modal opens or inputs change
  // retryTrigger is intentionally included to trigger re-execution when user clicks retry
  // biome-ignore lint/correctness/useExhaustiveDependencies: retryTrigger is intentionally included, submitState properties excluded
  useEffect(() => {
    let cancelled = false

    // Wait for captured values to be set before starting preparation
    // This prevents the effect from running twice (once before capture, once after)
    if (
      !isOpen ||
      !budgetRawAmount ||
      !maxValuationRawAmount ||
      !auctionAddress ||
      !capturedBudgetRawAmount ||
      !capturedMaxValuationRawAmount ||
      !clearingPriceQ96 ||
      !floorPriceQ96 ||
      !tickSizeQ96 ||
      fallbackBidTokenDecimals === undefined
    ) {
      return () => {
        cancelled = true
      }
    }

    setIsPreparing(true)

    ;(async () => {
      try {
        const result = await submitState.prepareTransaction()
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled) {
          // If result is undefined after passing validation, it means preparation failed
          if (!result) {
            setPreparedBid(undefined)
            setPreparationError(
              new Error(
                'Bid preparation returned no result. Check max valuation and budget values, or retry once data is loaded.',
              ),
            )
          } else {
            setPreparedBid(result)
            setPreparationError(undefined)
          }
        }
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled) {
          // biome-ignore lint/suspicious/noConsole: intentional error logging for debugging
          console.error('Bid preparation failed:', error)
          setPreparedBid(undefined)
          setPreparationError(error instanceof Error ? error : new Error('Failed to prepare bid'))
        }
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled) {
          setIsPreparing(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
    // Note: submitState.isDisabled and submitState.prepareTransaction are intentionally NOT in deps
    // because they can change during the async operation and would cause infinite re-runs
    // Using captured values to prevent re-triggering when live form values change
  }, [
    auctionAddress,
    capturedBudgetRawAmount,
    capturedMaxValuationRawAmount,
    clearingPriceQ96,
    floorPriceQ96,
    isOpen,
    retryTrigger,
    tickSizeQ96,
    fallbackBidTokenDecimals,
  ])

  // Calculate max price per token as a decimal for SubscriptZeroPrice component
  const maxPricePerTokenDecimal = useMemo(() => {
    if (!preparedBid) {
      return undefined
    }
    try {
      return fromQ96ToDecimalWithTokenDecimals({
        q96Value: BigInt(preparedBid.info.maxPriceQ96),
        bidTokenDecimals: fallbackBidTokenDecimals,
        auctionTokenDecimals,
      })
    } catch {
      return undefined
    }
  }, [auctionTokenDecimals, fallbackBidTokenDecimals, preparedBid])

  // Calculate Max FDV (totalSupply * maxPrice) in bid token
  const maxFdvData = useMemo(() => {
    if (!preparedBid || !totalSupply || !auctionTokenDecimals || fallbackBidTokenDecimals === undefined) {
      return { formatted: undefined, fiatFormatted: undefined, preciseFormatted: undefined }
    }

    try {
      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96: preparedBid.info.maxPriceQ96,
        bidTokenDecimals: fallbackBidTokenDecimals,
        totalSupplyRaw: totalSupply,
        auctionTokenDecimals,
      })

      // Compact format for display (e.g., "470.7k ETH")
      const formatted = formatCompactFromRaw({
        raw: fdvRaw,
        decimals: fallbackBidTokenDecimals,
        maxFractionDigits: 2,
      })

      // Approximate number for fiat and precise formatting
      const fdvBidTokenApprox = approximateNumberFromRaw({
        raw: fdvRaw,
        decimals: fallbackBidTokenDecimals,
        significantDigits: 15,
      })

      // Calculate fiat value (if price available and valid)
      let fiatFormatted: string | undefined
      if (bidTokenPriceFiat !== undefined && Number.isFinite(bidTokenPriceFiat)) {
        const fdvFiat = fdvBidTokenApprox * bidTokenPriceFiat
        if (Number.isFinite(fdvFiat)) {
          fiatFormatted = convertFiatAmountFormatted(fdvFiat, NumberType.FiatTokenStats)
        }
      }

      // Precise format for legal text
      const preciseFormatted = formatNumberOrString({ value: fdvBidTokenApprox.toString(), type: NumberType.TokenTx })

      return {
        formatted: budgetSymbol ? `${formatted} ${budgetSymbol}` : formatted,
        fiatFormatted,
        preciseFormatted: budgetSymbol ? `${preciseFormatted} ${budgetSymbol}` : preciseFormatted,
      }
    } catch {
      return { formatted: undefined, fiatFormatted: undefined, preciseFormatted: undefined }
    }
  }, [
    preparedBid,
    totalSupply,
    auctionTokenDecimals,
    fallbackBidTokenDecimals,
    budgetSymbol,
    bidTokenPriceFiat,
    convertFiatAmountFormatted,
    formatNumberOrString,
  ])

  // Check if price is below minimum valid bid
  // Contract requires bids to be strictly above clearing price AND at tick boundaries
  const maxPriceQ96 = useMemo(() => {
    if (!preparedBid) {
      return undefined
    }
    return BigInt(preparedBid.info.maxPriceQ96)
  }, [preparedBid])

  const { isBelowMinimum, minValidBidDisplay } = useMinValidBid({
    clearingPriceQ96,
    floorPriceQ96,
    tickSizeQ96,
    bidTokenDecimals: fallbackBidTokenDecimals,
    auctionTokenDecimals,
  })

  const isPriceBelowClearing = maxPriceQ96 ? isBelowMinimum(maxPriceQ96) : false

  // Calculate gas fee
  const gasFee = useTransactionGasFee(shouldEstimateGas ? preparedBid?.txRequest : undefined)
  const gasFeeCurrencyAmount = useMemo(() => {
    // Also require normalizedChainId to avoid showing gas fees from the wrong chain
    if (!preparedBid || !gasFee.value || !nativeCurrencyInfo?.currency || !normalizedChainId) {
      return undefined
    }
    return CurrencyAmount.fromRawAmount(nativeCurrencyInfo.currency, gasFee.value)
  }, [gasFee.value, nativeCurrencyInfo?.currency, normalizedChainId, preparedBid])

  const { formattedGasFee } = useFormattedGasFee({ gasFeeCurrencyAmount })

  const retryPreparation = useCallback(() => {
    // Clear the error first, then trigger retry
    setPreparationError(undefined)
    setRetryTrigger((prev) => prev + 1)
  }, [])

  const isConfirmDisabled =
    !normalizedChainId ||
    submitState.isDisabled ||
    !preparedBid ||
    isPriceBelowClearing ||
    isPreparing ||
    submitState.isPending ||
    Boolean(preparationError)

  return {
    preparedBid,
    isPreparing,
    preparationError,
    maxPricePerTokenDecimal,
    maxFdvFormatted: maxFdvData.formatted,
    maxFdvFiatFormatted: maxFdvData.fiatFormatted,
    maxFdvPreciseFormatted: maxFdvData.preciseFormatted,
    isPriceBelowClearing,
    formattedGasFee,
    isConfirmDisabled,
    retryPreparation,
    minValidBidDisplay,
  }
}
