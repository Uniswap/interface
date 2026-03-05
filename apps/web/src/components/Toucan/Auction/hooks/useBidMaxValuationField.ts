/* eslint-disable max-lines */
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCPrice, useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { useEvent } from 'utilities/src/react/hooks'
import { priceToQ96WithDecimals, q96ToPriceString } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { snapToNearestTick } from '~/components/Toucan/Auction/utils/ticks'
import tryParseCurrencyAmount from '~/lib/utils/tryParseCurrencyAmount'

const MAX_FIAT_PRECISION = 12

function formatFiatWithPrecision(value: number): string {
  if (!value || !Number.isFinite(value)) {
    return ''
  }
  return parseFloat(value.toFixed(MAX_FIAT_PRECISION)).toString()
}

interface MinValuationErrorDetails {
  inputValueDecimal: number
  minValueDecimal: number
}

export interface MaxValuationFieldState {
  currencyAmount: CurrencyAmount<Currency> | undefined
  currencyBalance: CurrencyAmount<Currency> | undefined
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  usdValue: CurrencyAmount<Currency> | null
  value: string
  tokenValue: string
  snappedTokenValue: string
  bidTokenSymbol: string
  error?: string
  errorDetails?: MinValuationErrorDetails
  isFiatMode: boolean
  onChange: (amount: string) => void
  onTokenValueChange: (amount: string) => void
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

  const [hasInitializedDefault, setHasInitializedDefault] = useState(false)
  const [displayValueOverride, setDisplayValueOverride] = useState<string | null>(null)

  // Ref to track when blur snap should be skipped (e.g., when modal is opening on mobile)
  const skipBlurSnapRef = useRef(false)

  const setSkipBlurSnap = useEvent((skip: boolean) => {
    skipBlurSnapRef.current = skip
  })

  const { convertFiatAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount(1).amount
  const chainId = bidCurrency?.chainId

  const maxValuationCurrencyAmount = tryParseCurrencyAmount(exactMaxValuationAmountToken, bidCurrency)
  const maxValuationUsdValue = useUSDCValue(maxValuationCurrencyAmount)
  const { price: usdPriceOfCurrency } = useUSDCPrice(bidCurrency)

  useEffect(() => {
    if (!bidCurrency || !usdPriceOfCurrency || !chainId) {
      return
    }

    if (isMaxValuationFiatMode) {
      const fiatAmount =
        exactMaxValuationAmountFiat && !isNaN(parseFloat(exactMaxValuationAmountFiat))
          ? parseFloat(exactMaxValuationAmountFiat)
          : 0
      const stablecoin = getPrimaryStablecoin(chainId)
      const stablecoinDecimals = stablecoin.decimals
      const usdAmount = (fiatAmount / conversionRate).toFixed(stablecoinDecimals)
      const stablecoinAmount = getCurrencyAmount({
        value: usdAmount,
        valueType: ValueType.Exact,
        currency: stablecoin,
      })
      const tokenAmount = stablecoinAmount ? usdPriceOfCurrency.invert().quote(stablecoinAmount) : undefined

      let snappedTokenValue = tokenAmount?.toExact() ?? ''
      if (
        tokenAmount &&
        clearingPriceQ96 &&
        floorPriceQ96 &&
        tickSizeQ96 &&
        bidTokenDecimals !== undefined &&
        auctionTokenDecimals !== undefined
      ) {
        const rawAmount = BigInt(tokenAmount.quotient.toString())
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
      const tokenAmount = getCurrencyAmount({
        value: exactMaxValuationAmountToken,
        valueType: ValueType.Exact,
        currency: bidCurrency,
      })
      const usdAmount = tokenAmount ? usdPriceOfCurrency.quote(tokenAmount) : undefined
      const fiatAmount = usdAmount ? parseFloat(usdAmount.toExact()) * conversionRate : 0
      const fiatAmountFormatted = formatFiatWithPrecision(fiatAmount)
      if (fiatAmountFormatted !== exactMaxValuationAmountFiat) {
        setExactMaxValuationAmountFiat(fiatAmountFormatted)
      }
    }
  }, [
    exactMaxValuationAmountFiat,
    exactMaxValuationAmountToken,
    bidCurrency,
    conversionRate,
    chainId,
    usdPriceOfCurrency,
    isMaxValuationFiatMode,
    clearingPriceQ96,
    floorPriceQ96,
    tickSizeQ96,
    bidTokenDecimals,
    auctionTokenDecimals,
  ])

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
    if (!snappedTokenValue || !bidCurrency || !usdPriceOfCurrency) {
      return exactMaxValuationAmountFiat
    }

    const snappedValue = parseFloat(snappedTokenValue)
    if (snappedValue === 0 || !Number.isFinite(snappedValue)) {
      return exactMaxValuationAmountFiat
    }

    const tokenAmount = getCurrencyAmount({
      value: snappedTokenValue,
      valueType: ValueType.Exact,
      currency: bidCurrency,
    })
    if (!tokenAmount) {
      return exactMaxValuationAmountFiat
    }

    const usdAmount = usdPriceOfCurrency.quote(tokenAmount)
    const fiatAmount = parseFloat(usdAmount.toExact()) * conversionRate
    return fiatAmount ? fiatAmount.toFixed(MAX_FIAT_PRECISION) : exactMaxValuationAmountFiat
  }, [snappedTokenValue, bidCurrency, usdPriceOfCurrency, conversionRate, exactMaxValuationAmountFiat])

  const handleMaxValuationChange = useEvent((amount: string) => {
    setDisplayValueOverride(amount)

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
  // Used by the slider and chart clicks which always work in token units
  const handleTokenValueChange = useEvent((amount: string) => {
    setDisplayValueOverride(null)
    setExactMaxValuationAmountToken(amount)

    // Skip the next blur snap since slider/chart values are already correctly snapped
    // This prevents precision drift from redundant round-trip conversions when focus
    // moves from the input to the slider (which triggers onBlur on web)
    skipBlurSnapRef.current = true

    if (isMaxValuationFiatMode && bidCurrency && usdPriceOfCurrency) {
      const tokenAmount = getCurrencyAmount({
        value: amount,
        valueType: ValueType.Exact,
        currency: bidCurrency,
      })
      const usdAmount = tokenAmount ? usdPriceOfCurrency.quote(tokenAmount) : undefined
      const fiatAmount = usdAmount ? parseFloat(usdAmount.toExact()) * conversionRate : 0
      const fiatAmountFormatted = fiatAmount ? fiatAmount.toFixed(MAX_FIAT_PRECISION) : ''
      setExactMaxValuationAmountFiat(fiatAmountFormatted)
    }

    setMaxPriceError(undefined)
    setMaxPriceErrorDetails(undefined)
    onInputChange?.()
  })

  const onToggleValuationFiatMode = useEvent(() => {
    setDisplayValueOverride(null)

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

  const evaluateMaxPrice = useEvent(
    (options?: {
      shouldAutoCorrectMin?: boolean
    }): {
      sanitizedQ96?: bigint
      sanitizedDisplayValue?: string
      error?: string
      errorDetails?: MinValuationErrorDetails
    } => {
      if (
        bidTokenDecimals === undefined ||
        auctionTokenDecimals === undefined ||
        !maxValuationCurrencyAmount ||
        !tickSizeQ96 ||
        !clearingPriceQ96 ||
        !floorPriceQ96 ||
        !minMaxPriceQ96
      ) {
        return {}
      }

      const rawAmount = BigInt(maxValuationCurrencyAmount.quotient.toString())
      if (rawAmount === 0n) {
        return {}
      }

      const inputQ96 = priceToQ96WithDecimals({ priceRaw: rawAmount, auctionTokenDecimals })

      // Use the correctly calculated minimum from useMinValidBid hook
      // instead of the simplified (and incorrect) clearingPriceQ96 + tickSizeQ96
      if (inputQ96 < minMaxPriceQ96) {
        if (options?.shouldAutoCorrectMin) {
          const sanitizedDisplayValue = q96ToPriceString({
            q96Value: minMaxPriceQ96,
            bidTokenDecimals,
            auctionTokenDecimals,
          })
          return { sanitizedQ96: minMaxPriceQ96, sanitizedDisplayValue }
        }
        const inputDisplay = q96ToPriceString({ q96Value: inputQ96, bidTokenDecimals, auctionTokenDecimals })
        const minDisplay = minValidPriceDisplay ?? ''
        return {
          error: t('toucan.bidForm.minValuationError', {
            value: minValidPriceDisplayFormatted ?? minDisplay,
            symbol: bidTokenSymbol ? ` ${bidTokenSymbol}` : '',
          }),
          errorDetails: {
            inputValueDecimal: Number(inputDisplay),
            minValueDecimal: Number(minDisplay),
          },
        }
      }

      const snappedQ96 = snapToNearestTick({
        value: inputQ96,
        floorPrice: floorPriceQ96,
        clearingPrice: clearingPriceQ96,
        tickSize: tickSizeQ96,
      })
      const sanitizedDisplayValue = q96ToPriceString({ q96Value: snappedQ96, bidTokenDecimals, auctionTokenDecimals })

      return { sanitizedQ96: snappedQ96, sanitizedDisplayValue }
    },
  )

  const handleMaxPriceBlur = useEvent(() => {
    setDisplayValueOverride(null)

    // Skip re-snapping if flag is set (e.g., when modal is opening on mobile)
    // This prevents precision drift from the round-trip conversion
    if (skipBlurSnapRef.current) {
      skipBlurSnapRef.current = false
      return
    }

    const { sanitizedDisplayValue, error, errorDetails } = evaluateMaxPrice()

    if (error) {
      setMaxPriceError(error)
      setMaxPriceErrorDetails(errorDetails)
      return
    }

    setMaxPriceError(undefined)
    setMaxPriceErrorDetails(undefined)

    if (sanitizedDisplayValue && sanitizedDisplayValue !== exactMaxValuationAmountToken) {
      setExactMaxValuationAmountToken(sanitizedDisplayValue)

      if (isMaxValuationFiatMode && bidCurrency && usdPriceOfCurrency) {
        const tokenAmount = getCurrencyAmount({
          value: sanitizedDisplayValue,
          valueType: ValueType.Exact,
          currency: bidCurrency,
        })
        const usdAmount = tokenAmount ? usdPriceOfCurrency.quote(tokenAmount) : undefined
        const fiatAmount = usdAmount ? parseFloat(usdAmount.toExact()) * conversionRate : 0
        const fiatAmountFormatted = fiatAmount ? fiatAmount.toFixed(MAX_FIAT_PRECISION) : ''
        setExactMaxValuationAmountFiat(fiatAmountFormatted)
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
      snappedTokenValue,
      bidTokenSymbol,
      error: maxPriceError,
      errorDetails: maxPriceErrorDetails,
      isFiatMode: isMaxValuationFiatMode,
      onChange: handleMaxValuationChange,
      onTokenValueChange: handleTokenValueChange,
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
    evaluateMaxPrice,
    resetMaxValuationField,
  }
}
