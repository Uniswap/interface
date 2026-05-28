import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { priceToQ96WithDecimals, q96ToPriceString } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { snapToNearestTick } from '~/features/Toucan/Auction/utils/ticks'

export interface MinValuationErrorDetails {
  inputValueDecimal: number
  minValueDecimal: number
}

export interface EvaluateMaxPriceResult {
  sanitizedQ96?: bigint
  sanitizedDisplayValue?: string
  error?: string
  errorDetails?: MinValuationErrorDetails
}

interface EvaluateMaxPriceParams {
  bidTokenDecimals: number | undefined
  auctionTokenDecimals: number | undefined
  maxValuationCurrencyAmount: CurrencyAmount<Currency> | undefined
  tickSizeQ96: bigint | undefined
  clearingPriceQ96: bigint | undefined
  floorPriceQ96: bigint | undefined
  minMaxPriceQ96: bigint | undefined
  minValidPriceDisplay: string | undefined
  minValidPriceDisplayFormatted: string | undefined
  bidTokenSymbol: string
  shouldAutoCorrectMin?: boolean
  formatError: (params: { value: string; symbol: string }) => string
}

export function evaluateMaxPrice({
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
  shouldAutoCorrectMin,
  formatError,
}: EvaluateMaxPriceParams): EvaluateMaxPriceResult {
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
    if (shouldAutoCorrectMin) {
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
      error: formatError({
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
}
