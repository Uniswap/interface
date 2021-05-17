import { Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { USDC } from '../constants'
import { useV2TradeExactOut } from './useV2Trade'
import { tryParseAmount } from 'state/swap/hooks'
import { useBestV3TradeExactOut, V3TradeState } from './useBestV3Trade'

// USDC amount used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
const usdcCurrencyAmount = tryParseAmount('10000', USDC)

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price<Currency, Token> | undefined {
  const v2USDCTrade = useV2TradeExactOut(currency, usdcCurrencyAmount)
  const v3USDCTrade = useBestV3TradeExactOut(currency, usdcCurrencyAmount)

  if (!currency) return undefined

  // Use v2 price if available, v3 as fallback.
  if (v2USDCTrade) {
    const { numerator, denominator } = v2USDCTrade.route.midPrice
    return new Price(currency, USDC, denominator, numerator)
  } else if (v3USDCTrade.state === V3TradeState.VALID && v3USDCTrade.trade) {
    const { numerator, denominator } = v3USDCTrade.trade.route.midPrice
    return new Price(currency, USDC, denominator, numerator)
  }

  return undefined
}

export function useUSDCValue(currencyAmount: CurrencyAmount<Currency> | undefined | null) {
  const price = useUSDCPrice(currencyAmount?.currency)

  return useMemo(() => {
    if (!price || !currencyAmount) return null
    try {
      return price.quote(currencyAmount)
    } catch (error) {
      return null
    }
  }, [currencyAmount, price])
}
