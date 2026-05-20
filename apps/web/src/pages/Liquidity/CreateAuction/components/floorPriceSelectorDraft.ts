import { type Currency, type CurrencyAmount, Price } from '@uniswap/sdk-core'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { formatArithmeticResultForInput } from '~/pages/Liquidity/CreateAuction/utils'

// Two independent axes:
//   denomination – what the numeric input represents (floor price per token, or FDV)
//   inputCurrency – the currency the user types in (raise token, or USD fiat)
export type FloorPriceDenomination = 'floorPrice' | 'fdv'
export type InputCurrency = 'raise' | 'usd'

/** Max fraction digits when typing USD-denominated values (fiat / USD FDV). */
const USD_DRAFT_MAX_DECIMALS = 8

export function exceedsDecimalCap(normalized: string, maxDecimals: number): boolean {
  const dotIndex = normalized.indexOf('.')
  return dotIndex !== -1 && normalized.length - dotIndex - 1 > maxDecimals
}

export function maxDecimalsForDraftInput(inputCurrency: InputCurrency, raiseTokenDecimals: number | undefined): number {
  if (inputCurrency === 'usd') {
    return USD_DRAFT_MAX_DECIMALS
  }
  return raiseTokenDecimals ?? 18
}

/**
 * Single pipeline: draft string + mode + oracles → canonical floor price (raise token per auction token).
 * Used only for non–parent-controlled modes; parent-controlled commits directly in the change handler.
 */
export function commitDraftToFloorPrice({
  localValue,
  denomination,
  inputCurrency,
  usdPriceNum,
  tokenTotalSupply,
  raiseCurrency,
}: {
  localValue: string
  denomination: FloorPriceDenomination
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  tokenTotalSupply: CurrencyAmount<Currency>
  raiseCurrency: Currency | undefined
}): string {
  const trimmed = localValue.trim()
  if (!trimmed) {
    return ''
  }
  const num = parseFloat(trimmed)
  if (!Number.isFinite(num) || num <= 0) {
    return ''
  }

  if (tokenTotalSupply.equalTo(0)) {
    return ''
  }

  if (denomination === 'floorPrice' && inputCurrency === 'usd') {
    if (!usdPriceNum || usdPriceNum <= 0) {
      return ''
    }
    return formatArithmeticResultForInput(num / usdPriceNum)
  }

  if (denomination === 'fdv' && inputCurrency === 'raise') {
    if (!raiseCurrency) {
      return ''
    }
    const fdvAmount = getCurrencyAmount({
      value: trimmed,
      valueType: ValueType.Exact,
      currency: raiseCurrency,
    })
    if (!fdvAmount || fdvAmount.equalTo(0)) {
      return ''
    }
    try {
      const price = new Price({
        baseAmount: tokenTotalSupply,
        quoteAmount: fdvAmount,
      })
      return price.toSignificant(18)
    } catch {
      return ''
    }
  }

  // fdv + usd
  if (!usdPriceNum || usdPriceNum <= 0 || !raiseCurrency) {
    return ''
  }
  const fdvRaiseHuman = formatArithmeticResultForInput(num / usdPriceNum)
  if (!fdvRaiseHuman) {
    return ''
  }
  const fdvAmount = getCurrencyAmount({
    value: fdvRaiseHuman,
    valueType: ValueType.Exact,
    currency: raiseCurrency,
  })
  if (!fdvAmount || fdvAmount.equalTo(0)) {
    return ''
  }
  try {
    const price = new Price({
      baseAmount: tokenTotalSupply,
      quoteAmount: fdvAmount,
    })
    return price.toSignificant(18)
  } catch {
    return ''
  }
}

/**
 * Maps canonical floor price into the draft string for a *target* mode after a toggle.
 * Does not support `floorPrice + raise` (parent-controlled): that mode reads `floorPrice` from props;
 * callers must not pass that combination — it returns `''` by design.
 */
export function getDisplayValueForMode({
  denomination,
  inputCurrency,
  floorPriceNum,
  totalSupplyNum,
  usdPriceNum,
  hasValidFloorPrice,
}: {
  denomination: FloorPriceDenomination
  inputCurrency: InputCurrency
  floorPriceNum: number
  totalSupplyNum: number
  usdPriceNum: number | null
  hasValidFloorPrice: boolean
}): string {
  if (!hasValidFloorPrice) {
    return ''
  }
  if (denomination === 'floorPrice' && inputCurrency === 'usd') {
    return usdPriceNum !== null ? formatArithmeticResultForInput(floorPriceNum * usdPriceNum) : ''
  }
  if (denomination === 'fdv' && inputCurrency === 'raise') {
    return Number.isFinite(totalSupplyNum) ? formatArithmeticResultForInput(floorPriceNum * totalSupplyNum) : ''
  }
  if (denomination === 'fdv' && inputCurrency === 'usd') {
    return usdPriceNum !== null && Number.isFinite(totalSupplyNum)
      ? formatArithmeticResultForInput(floorPriceNum * totalSupplyNum * usdPriceNum)
      : ''
  }
  return ''
}
