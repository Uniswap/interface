import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFiatTokenConversion } from 'uniswap/src/features/transactions/hooks/useFiatTokenConversion'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { useEvent } from 'utilities/src/react/hooks'
import { priceToQ96WithDecimals, q96ToPriceString } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import type { UseBidMaxValuationFieldParams } from '~/features/Toucan/Auction/hooks/useBidMaxValuationField.types'
import {
  capTokenDisplayValue,
  computeBidMaxPriceQ96,
  snapTokenDisplayValue,
} from '~/features/Toucan/Auction/utils/bidMaxPrice'
import { evaluateMaxPrice, type MinValuationErrorDetails } from '~/features/Toucan/Auction/utils/evaluateMaxPrice'
import { snapToNearestTick } from '~/features/Toucan/Auction/utils/ticks'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'

export type { MaxValuationFieldState } from '~/features/Toucan/Auction/hooks/useBidMaxValuationField.types'

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
  maxBidPriceQ96,
  minValidPriceDisplay,
  minValidPriceDisplayFormatted,
  defaultMaxValuationDisplay,
  onInputChange,
}: UseBidMaxValuationFieldParams) {
  const { t } = useTranslation()

  const parseRawBidTokenAmount = useEvent((value: string): bigint | undefined => {
    const amount = tryParseCurrencyAmount(value, bidCurrency)
    return amount ? BigInt(amount.quotient.toString()) : undefined
  })

  const [exactMaxValuationAmountToken, setExactMaxValuationAmountToken] = useState('')
  const [exactMaxValuationAmountFiat, setExactMaxValuationAmountFiat] = useState('')
  const [isMaxValuationFiatMode, setIsMaxValuationFiatMode] = useState(false)
  const [maxPriceError, setMaxPriceError] = useState<string | undefined>()
  const [maxPriceErrorDetails, setMaxPriceErrorDetails] = useState<MinValuationErrorDetails | undefined>()
  const [wasCappedToMax, setWasCappedToMax] = useState(false)
  // Q96 stored directly from slider to avoid precision loss in Q96→string→Q96 roundtrips
  const [tokenPriceQ96, setTokenPriceQ96] = useState<bigint | undefined>(undefined)

  const [hasInitializedDefault, setHasInitializedDefault] = useState(false)
  const [displayValueOverride, setDisplayValueOverride] = useState<string | null>(null)

  // Whether the user has actually entered a max valuation (typed, dragged the slider, or clicked a chart tick).
  // The field is pre-filled with a default before any interaction, so downstream consumers (e.g. the chart's
  // "Your bid" indicator) must not treat the default as user input.
  const [hasUserSetMaxValuation, setHasUserSetMaxValuation] = useState(false)

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
        const snapped = snapTokenDisplayValue({
          tokenValue: converted,
          bidTokenDecimals,
          auctionTokenDecimals,
          clearingPriceQ96,
          floorPriceQ96,
          tickSizeQ96,
          maxBidPriceQ96,
          parseRawAmount: parseRawBidTokenAmount,
        })
        if (snapped !== undefined) {
          snappedTokenValue = snapped
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
    maxBidPriceQ96,
    bidTokenDecimals,
    auctionTokenDecimals,
    parseRawBidTokenAmount,
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

  const maxPriceQ96 = useMemo(
    () =>
      computeBidMaxPriceQ96({
        rawAmount: maxValuationCurrencyAmount ? BigInt(maxValuationCurrencyAmount.quotient.toString()) : undefined,
        auctionTokenDecimals,
        clearingPriceQ96,
        floorPriceQ96,
        tickSizeQ96,
        maxBidPriceQ96,
      }),
    [maxValuationCurrencyAmount, auctionTokenDecimals, clearingPriceQ96, floorPriceQ96, tickSizeQ96, maxBidPriceQ96],
  )

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
    setHasUserSetMaxValuation(true)
    setWasCappedToMax(false)
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

  // Sets the token value directly, bypassing fiat mode, without claiming user authorship.
  // Programmatic writers (the ceiling recap, the QuickLaunch peg) must use this path: flipping
  // hasUserSetMaxValuation would draw a "Your bid" indicator for a value the user never entered.
  const applyTokenValueWithoutUserIntent = useEvent((amount: string) => {
    setDisplayValueOverride(null)

    // This path suppresses the blur snap, so a charted tick above the ceiling would stay
    // in the field and be bid at a price other than the one it shows.
    const { value: nextAmount, cappedToMax } = capTokenDisplayValue({
      tokenValue: amount,
      bidTokenDecimals,
      auctionTokenDecimals,
      clearingPriceQ96,
      floorPriceQ96,
      tickSizeQ96,
      maxBidPriceQ96,
      parseRawAmount: parseRawBidTokenAmount,
    })

    setWasCappedToMax(cappedToMax)
    setExactMaxValuationAmountToken(nextAmount)
    setTokenPriceQ96(undefined)

    // Skip the next blur snap since chart values are already correctly snapped
    // This prevents precision drift from redundant round-trip conversions when focus
    // moves from the input to the slider (which triggers onBlur on web)
    skipBlurSnapRef.current = true

    if (isMaxValuationFiatMode) {
      const fiatAmountFormatted = bidTokenToFiat(nextAmount)
      setExactMaxValuationAmountFiat(fiatAmountFormatted ?? '')
    }

    setMaxPriceError(undefined)
    setMaxPriceErrorDetails(undefined)
    onInputChange?.()
  })

  // Used by chart tick clicks, which always work in token units and are real user input
  const handleTokenValueChange = useEvent((amount: string) => {
    setHasUserSetMaxValuation(true)
    applyTokenValueWithoutUserIntent(amount)
  })

  // Handler for slider Q96 changes — stores Q96 directly to avoid precision loss
  const handleTokenValueQ96Change = useEvent((q96: bigint) => {
    if (bidTokenDecimals === undefined || auctionTokenDecimals === undefined) {
      return
    }

    setHasUserSetMaxValuation(true)
    setWasCappedToMax(false)
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
      const snappedDisplayValue = snapTokenDisplayValue({
        tokenValue: exactMaxValuationAmountToken,
        bidTokenDecimals,
        auctionTokenDecimals,
        clearingPriceQ96,
        floorPriceQ96,
        tickSizeQ96,
        maxBidPriceQ96,
        parseRawAmount: parseRawBidTokenAmount,
      })
      if (snappedDisplayValue !== undefined) {
        setExactMaxValuationAmountToken(snappedDisplayValue)
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
      maxBidPriceQ96,
      bidTokenSymbol,
      shouldAutoCorrectMin: options?.shouldAutoCorrectMin,
      formatMinError: ({ value, symbol }) => t('toucan.bidForm.minValuationError', { value, symbol }),
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

    const { sanitizedDisplayValue, error, errorDetails, cappedToMax } = evaluateMaxPriceFn()
    setWasCappedToMax(!!cappedToMax)

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
    setHasUserSetMaxValuation(false)
    setWasCappedToMax(false)
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
      wasCappedToMax,
      isFiatMode: isMaxValuationFiatMode,
      onChange: handleMaxValuationChange,
      onTokenValueChange: handleTokenValueChange,
      onTokenValueQ96Change: handleTokenValueQ96Change,
      onBlur: handleMaxPriceBlur,
      onToggleFiatMode: onToggleValuationFiatMode,
      setSkipBlurSnap,
    },
    exactMaxValuationAmount: exactMaxValuationAmountToken,
    hasUserSetMaxValuation,
    applyTokenValueWithoutUserIntent,
    maxValuationCurrencyAmount,
    maxPriceAmountIsZero,
    maxPriceQ96,
    isMaxPriceBelowMinimum,
    setMaxPriceError,
    evaluateMaxPrice: evaluateMaxPriceFn,
    resetMaxValuationField,
  }
}
