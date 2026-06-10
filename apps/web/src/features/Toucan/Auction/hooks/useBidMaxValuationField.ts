import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useFiatTokenConversion } from 'uniswap/src/features/transactions/hooks/useFiatTokenConversion'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { useEvent } from 'utilities/src/react/hooks'
import { priceToQ96WithDecimals, q96ToPriceString } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { evaluateMaxPrice, type MinValuationErrorDetails } from '~/features/Toucan/Auction/utils/evaluateMaxPrice'
import { snapToNearestTick } from '~/features/Toucan/Auction/utils/ticks'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'

export interface MaxValuationFieldState {
  currencyAmount: CurrencyAmount<Currency> | undefined
  currencyBalance: CurrencyAmount<Currency> | undefined
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  usdValue: CurrencyAmount<Currency> | null
  value: string
  tokenValue: string
  tokenValueQ96: bigint | undefined
  snappedTokenValue: string
  bidTokenSymbol: string
  error?: string
  errorDetails?: MinValuationErrorDetails
  isFiatMode: boolean
  onChange: (amount: string) => void
  onTokenValueChange: (amount: string) => void
  onTokenValueQ96Change: (q96: bigint) => void
  onBlur: () => void
  onToggleFiatMode: () => void
  setSkipBlurSnap: (skip: boolean) => void
}

interface UseBidMaxValuationFieldParams {
  bidCurrency: Currency | undefined
  currencyBalance: CurrencyAmount<Currency> | undefined
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  bidTokenDecimals: number | undefined
  auctionTokenDecimals: number | undefined
  bidTokenSymbol: string
  clearingPriceQ96: bigint | undefined
  floorPriceQ96: bigint | undefined
  tickSizeQ96: bigint | undefined
  minMaxPriceQ96: bigint | undefined
  minValidPriceDisplay: string | undefined
  minValidPriceDisplayFormatted: string | undefined
  defaultMaxValuationDisplay: string
  onInputChange?: () => void
}

export function useBidMaxValuationField({
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
}: UseBidMaxValuationFieldParams) {
  const { t } = useTranslation()

  const [exactMaxValuationAmountToken, setExactMaxValuationAmountToken] = useState('')
  const [exactMaxValuationAmountFiat, setExactMaxValuationAmountFiat] = useState('')
  const [isMaxValuationFiatMode, setIsMaxValuationFiatMode] = useState(false)
  const [maxPriceError, setMaxPriceError] = useState<string | undefined>()
  const [maxPriceErrorDetails, setMaxPriceErrorDetails] = useState<MinValuationErrorDetails | undefined>()
  // Q96 stored directly from slider to avoid precision loss in Q96→string→Q96 roundtrips
  const [tokenPriceQ96, setTokenPriceQ96] = useState<bigint | undefined>(undefined)

  const [hasInitializedDefault, setHasInitializedDefault] = useState(false)
  const [displayValueOverride, setDisplayValueOverride] = useState<string | null>(null)

  // Ref to track when blur snap should be skipped (e.g., when modal is opening on mobile)
  const skipBlurSnapRef = useRef(false)

  const setSkipBlurSnap = useEvent((skip: boolean) => {
    skipBlurSnapRef.current = skip
  })

  const {
    usdPriceOfCurrency,
    fiatToToken: fiatToBidToken,
    tokenToFiat: bidTokenToFiat,
  } = useFiatTokenConversion({
    currency: bidCurrency,
  })

  const maxValuationCurrencyAmount = tryParseCurrencyAmount(exactMaxValuationAmountToken, bidCurrency)
  const maxValuationUsdValue = useUSDCValue(maxValuationCurrencyAmount)

  useEffect(() => {
    if (!bidCurrency || !usdPriceOfCurrency) {
      return
    }

    if (isMaxValuationFiatMode) {
      const converted = exactMaxValuationAmountFiat ? fiatToBidToken(exactMaxValuationAmountFiat) : null

      let snappedTokenValue = converted ?? ''
      if (
        converted &&
        clearingPriceQ96 &&
        floorPriceQ96 &&
        tickSizeQ96 &&
        bidTokenDecimals !== undefined &&
        auctionTokenDecimals !== undefined
      ) {
        const tokenAmount = tryParseCurrencyAmount(converted, bidCurrency)
        const rawAmount = tokenAmount ? BigInt(tokenAmount.quotient.toString()) : 0n
        if (rawAmount > 0n) {
          const tokenQ96 = priceToQ96WithDecimals({ priceRaw: rawAmount, auctionTokenDecimals })
          const snappedQ96 = snapToNearestTick({
            value: tokenQ96,
            floorPrice: floorPriceQ96,
            clearingPrice: clearingPriceQ96,
            tickSize: tickSizeQ96,
          })
          snappedTokenValue = q96ToPriceString({ q96Value: snappedQ96, bidTokenDecimals, auctionTokenDecimals })
        }
      }
      if (snappedTokenValue !== exactMaxValuationAmountToken) {
        setExactMaxValuationAmountToken(snappedTokenValue)
      }
    }

    // When we have new token amount (after user hit preset or changed mode)
    if (!isMaxValuationFiatMode || (!exactMaxValuationAmountFiat && exactMaxValuationAmountToken)) {
      const fiatAmountFormatted = bidTokenToFiat(exactMaxValuationAmountToken)
      if (fiatAmountFormatted && fiatAmountFormatted !== exactMaxValuationAmountFiat) {
        setExactMaxValuationAmountFiat(fiatAmountFormatted)
      } else if (!fiatAmountFormatted && exactMaxValuationAmountFiat) {
        setExactMaxValuationAmountFiat('')
      }
    }
  }, [
    exactMaxValuationAmountFiat,
    exactMaxValuationAmountToken,
    bidCurrency,
    usdPriceOfCurrency,
    fiatToBidToken,
    bidTokenToFiat,
    isMaxValuationFiatMode,
    clearingPriceQ96,
    floorPriceQ96,
    tickSizeQ96,
    bidTokenDecimals,
    auctionTokenDecimals,
  ])

  // Use slider's stored Q96 when available (full precision), otherwise derive from string
  const effectiveTokenPriceQ96 = useMemo(() => {
    if (tokenPriceQ96 !== undefined) {
      return tokenPriceQ96
    }
    if (!maxValuationCurrencyAmount || bidTokenDecimals === undefined || auctionTokenDecimals === undefined) {
      return undefined
    }
    const rawAmount = BigInt(maxValuationCurrencyAmount.quotient.toString())
    if (rawAmount === 0n) {
      return undefined
    }
    return priceToQ96WithDecimals({ priceRaw: rawAmount, auctionTokenDecimals })
  }, [tokenPriceQ96, maxValuationCurrencyAmount, bidTokenDecimals, auctionTokenDecimals])

  const maxPriceAmountIsZero = maxValuationCurrencyAmount?.equalTo(0) ?? true

  const maxPriceQ96 = useMemo(() => {
    if (!maxValuationCurrencyAmount || bidTokenDecimals === undefined || auctionTokenDecimals === undefined) {
      return undefined
    }

    const rawAmount = BigInt(maxValuationCurrencyAmount.quotient.toString())
    if (rawAmount === 0n) {
      return 0n
    }

    const unsnappedQ96 = priceToQ96WithDecimals({ priceRaw: rawAmount, auctionTokenDecimals })

    // Snap to the nearest valid tick to handle precision loss from decimal round-trips
    // This ensures that clicking on a tick in the chart results in exactly that tick,
    // even after going through decimal string → currency amount → Q96 conversions
    if (clearingPriceQ96 && floorPriceQ96 && tickSizeQ96) {
      return snapToNearestTick({
        value: unsnappedQ96,
        floorPrice: floorPriceQ96,
        clearingPrice: clearingPriceQ96,
        tickSize: tickSizeQ96,
      })
    }

    return unsnappedQ96
  }, [maxValuationCurrencyAmount, bidTokenDecimals, auctionTokenDecimals, clearingPriceQ96, floorPriceQ96, tickSizeQ96])

  const isMaxPriceBelowMinimum = useMemo(() => {
    if (!maxPriceQ96 || !minMaxPriceQ96) {
      return true
    }

    if (maxPriceQ96 === 0n) {
      return true
    }

    return maxPriceQ96 < minMaxPriceQ96
  }, [maxPriceQ96, minMaxPriceQ96])

  const snappedTokenValue = useMemo(() => {
    if (
      !maxPriceQ96 ||
      maxPriceQ96 === 0n ||
      bidTokenDecimals === undefined ||
      auctionTokenDecimals === undefined ||
      !clearingPriceQ96 ||
      !floorPriceQ96 ||
      !tickSizeQ96
    ) {
      return exactMaxValuationAmountToken
    }

    const snappedQ96 = snapToNearestTick({
      value: maxPriceQ96,
      floorPrice: floorPriceQ96,
      clearingPrice: clearingPriceQ96,
      tickSize: tickSizeQ96,
    })
    return q96ToPriceString({ q96Value: snappedQ96, bidTokenDecimals, auctionTokenDecimals })
  }, [
    maxPriceQ96,
    bidTokenDecimals,
    auctionTokenDecimals,
    clearingPriceQ96,
    floorPriceQ96,
    tickSizeQ96,
    exactMaxValuationAmountToken,
  ])

  const snappedFiatValue = useMemo(() => {
    if (!snappedTokenValue) {
      return exactMaxValuationAmountFiat
    }

    const snappedValue = parseFloat(snappedTokenValue)
    if (snappedValue === 0 || !Number.isFinite(snappedValue)) {
      return exactMaxValuationAmountFiat
    }

    return bidTokenToFiat(snappedTokenValue) ?? exactMaxValuationAmountFiat
  }, [snappedTokenValue, bidTokenToFiat, exactMaxValuationAmountFiat])

  const handleMaxValuationChange = useEvent((amount: string) => {
    setDisplayValueOverride(amount)
    setTokenPriceQ96(undefined)

    const normalizedAmount = (() => {
      if (amount === '') {
        return ''
      }
      if (amount === '.') {
        return '0'
      }
      if (amount.endsWith('.')) {
        return amount.slice(0, -1) || '0'
      }
      return amount
    })()

    if (isMaxValuationFiatMode) {
      setExactMaxValuationAmountFiat(normalizedAmount)
    } else {
      setExactMaxValuationAmountToken(normalizedAmount)
    }

    setMaxPriceError(undefined)
    setMaxPriceErrorDetails(undefined)
    onInputChange?.()
  })

  // Handler that always sets the token value directly, bypassing fiat mode
  // Used by chart clicks which always work in token units
  const handleTokenValueChange = useEvent((amount: string) => {
    setDisplayValueOverride(null)
    setExactMaxValuationAmountToken(amount)
    setTokenPriceQ96(undefined)

    // Skip the next blur snap since chart values are already correctly snapped
    // This prevents precision drift from redundant round-trip conversions when focus
    // moves from the input to the slider (which triggers onBlur on web)
    skipBlurSnapRef.current = true

    if (isMaxValuationFiatMode) {
      const fiatAmountFormatted = bidTokenToFiat(amount)
      setExactMaxValuationAmountFiat(fiatAmountFormatted ?? '')
    }

    setMaxPriceError(undefined)
    setMaxPriceErrorDetails(undefined)
    onInputChange?.()
  })

  // Handler for slider Q96 changes — stores Q96 directly to avoid precision loss
  const handleTokenValueQ96Change = useEvent((q96: bigint) => {
    if (bidTokenDecimals === undefined || auctionTokenDecimals === undefined) {
      return
    }

    setTokenPriceQ96(q96)
    const displayValue = q96ToPriceString({ q96Value: q96, bidTokenDecimals, auctionTokenDecimals })
    setDisplayValueOverride(null)
    setExactMaxValuationAmountToken(displayValue)
    skipBlurSnapRef.current = true

    if (isMaxValuationFiatMode) {
      const fiatAmountFormatted = bidTokenToFiat(displayValue)
      setExactMaxValuationAmountFiat(fiatAmountFormatted ?? '')
    }

    setMaxPriceError(undefined)
    setMaxPriceErrorDetails(undefined)
    onInputChange?.()
  })

  const onToggleValuationFiatMode = useEvent(() => {
    setDisplayValueOverride(null)
    setTokenPriceQ96(undefined)

    if (
      isMaxValuationFiatMode &&
      exactMaxValuationAmountToken &&
      bidTokenDecimals !== undefined &&
      auctionTokenDecimals !== undefined &&
      clearingPriceQ96 &&
      floorPriceQ96 &&
      tickSizeQ96
    ) {
      const currencyAmount = tryParseCurrencyAmount(exactMaxValuationAmountToken, bidCurrency)
      if (currencyAmount) {
        const rawAmount = BigInt(currencyAmount.quotient.toString())
        if (rawAmount > 0n) {
          const inputQ96 = priceToQ96WithDecimals({ priceRaw: rawAmount, auctionTokenDecimals })
          const snappedQ96 = snapToNearestTick({
            value: inputQ96,
            floorPrice: floorPriceQ96,
            clearingPrice: clearingPriceQ96,
            tickSize: tickSizeQ96,
          })
          const snappedDisplayValue = q96ToPriceString({ q96Value: snappedQ96, bidTokenDecimals, auctionTokenDecimals })
          setExactMaxValuationAmountToken(snappedDisplayValue)
        }
      }
    }

    if (!isMaxValuationFiatMode && snappedFiatValue && snappedFiatValue !== exactMaxValuationAmountFiat) {
      setExactMaxValuationAmountFiat(snappedFiatValue)
    }

    setIsMaxValuationFiatMode((prev) => !prev)
  })

  const evaluateMaxPriceFn = useEvent((options?: { shouldAutoCorrectMin?: boolean }) =>
    evaluateMaxPrice({
      bidTokenDecimals,
      auctionTokenDecimals,
      maxValuationCurrencyAmount,
      tickSizeQ96,
      clearingPriceQ96,
      floorPriceQ96,
      minMaxPriceQ96,
      minValidPriceDisplay,
      minValidPriceDisplayFormatted,
      bidTokenSymbol,
      shouldAutoCorrectMin: options?.shouldAutoCorrectMin,
      formatError: ({ value, symbol }) => t('toucan.bidForm.minValuationError', { value, symbol }),
    }),
  )

  const handleMaxPriceBlur = useEvent(() => {
    setDisplayValueOverride(null)

    // Skip re-snapping if flag is set (e.g., when modal is opening on mobile)
    // This prevents precision drift from the round-trip conversion
    if (skipBlurSnapRef.current) {
      skipBlurSnapRef.current = false
      return
    }

    const { sanitizedDisplayValue, error, errorDetails } = evaluateMaxPriceFn()

    if (error) {
      setMaxPriceError(error)
      setMaxPriceErrorDetails(errorDetails)
      return
    }

    setMaxPriceError(undefined)
    setMaxPriceErrorDetails(undefined)

    if (sanitizedDisplayValue && sanitizedDisplayValue !== exactMaxValuationAmountToken) {
      setExactMaxValuationAmountToken(sanitizedDisplayValue)
      setTokenPriceQ96(undefined)

      if (isMaxValuationFiatMode) {
        const fiatAmountFormatted = bidTokenToFiat(sanitizedDisplayValue)
        setExactMaxValuationAmountFiat(fiatAmountFormatted ?? '')
      }
    }
  })

  const resetMaxValuationField = useEvent(() => {
    setDisplayValueOverride(null)
    setMaxPriceError(undefined)
    setMaxPriceErrorDetails(undefined)
    setExactMaxValuationAmountToken(defaultMaxValuationDisplay)
    setExactMaxValuationAmountFiat('')
    setIsMaxValuationFiatMode(false)
    setTokenPriceQ96(undefined)
  })

  useEffect(() => {
    if (defaultMaxValuationDisplay && !hasInitializedDefault) {
      setExactMaxValuationAmountToken(defaultMaxValuationDisplay)
      setHasInitializedDefault(true)
    }
  }, [defaultMaxValuationDisplay, hasInitializedDefault])

  const displayValue = useMemo(() => {
    if (displayValueOverride !== null) {
      return displayValueOverride
    }

    if (isMaxValuationFiatMode) {
      return exactMaxValuationAmountFiat
    } else {
      return exactMaxValuationAmountToken
    }
  }, [displayValueOverride, isMaxValuationFiatMode, exactMaxValuationAmountFiat, exactMaxValuationAmountToken])

  return {
    maxValuationField: {
      currencyAmount: maxValuationCurrencyAmount,
      currencyBalance,
      currencyInfo,
      usdValue: maxValuationUsdValue,
      value: displayValue,
      tokenValue: exactMaxValuationAmountToken,
      tokenValueQ96: effectiveTokenPriceQ96,
      snappedTokenValue,
      bidTokenSymbol,
      error: maxPriceError,
      errorDetails: maxPriceErrorDetails,
      isFiatMode: isMaxValuationFiatMode,
      onChange: handleMaxValuationChange,
      onTokenValueChange: handleTokenValueChange,
      onTokenValueQ96Change: handleTokenValueQ96Change,
      onBlur: handleMaxPriceBlur,
      onToggleFiatMode: onToggleValuationFiatMode,
      setSkipBlurSnap,
    },
    exactMaxValuationAmount: exactMaxValuationAmountToken,
    maxValuationCurrencyAmount,
    maxPriceAmountIsZero,
    maxPriceQ96,
    isMaxPriceBelowMinimum,
    setMaxPriceError,
    evaluateMaxPrice: evaluateMaxPriceFn,
    resetMaxValuationField,
  }
}
