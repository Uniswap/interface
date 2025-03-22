import { Currency, CurrencyAmount, Fraction, Price } from '@uniswap/sdk-core'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'

// Show warning if the price diverges by more than 5%
const WARNING_THRESHOLD = new Fraction(5, 100)
// Use this to scale decimal values before operating on them
const DECIMAL_SCALAR = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))

function useMarketPrice(baseCurrency?: Currency, quoteCurrency?: Currency) {
  const baseCurrencyUSDPrice = useUSDCValue(
    baseCurrency
      ? CurrencyAmount.fromRawAmount(baseCurrency, JSBI.BigInt(parseUnits('1', baseCurrency?.decimals)))
      : undefined,
  )

  const quoteCurrencyUSDPrice = useUSDCValue(
    quoteCurrency
      ? CurrencyAmount.fromRawAmount(quoteCurrency, JSBI.BigInt(parseUnits('1', quoteCurrency?.decimals)))
      : undefined,
  )

  if (!baseCurrencyUSDPrice || !quoteCurrencyUSDPrice) {
    return undefined
  }

  const marketPrice = new Fraction(
    baseCurrencyUSDPrice.multiply(DECIMAL_SCALAR).toFixed(0),
    quoteCurrencyUSDPrice.multiply(DECIMAL_SCALAR).toFixed(0),
  )

  return marketPrice
}

/**
 * In Uniswap v3, the current price is quoted as the exchange from token0 to token1. However, depending
 * on liquidity conditions, the price in a particular pool can diverge from the rest of the market (i.e. other pools).
 * This hook computes the market exchange rate between two currencies and compares it to the given pool price.
 * If these prices diverge by more than WARNING_THRESHOLD, return true. Otherwise, return false.
 * @param baseCurrency The pool's base currency (a.k.a. token0)
 * @param quoteCurrency The pool's quote currency (a.k.a. token1)
 * @param poolPrice The exchange rate between token0 and token1
 */
export function useIsPoolOutOfSync(poolPrice?: Price<Currency, Currency>) {
  const marketPrice = useMarketPrice(poolPrice?.baseCurrency, poolPrice?.quoteCurrency)

  if (!poolPrice || !marketPrice) {
    return false
  }

  const scaledMarketPrice = JSBI.BigInt(marketPrice.multiply(DECIMAL_SCALAR).toFixed(0))
  const scaledPoolPrice = JSBI.BigInt(
    poolPrice
      .quote(
        CurrencyAmount.fromRawAmount(
          poolPrice.baseCurrency,
          JSBI.BigInt(parseUnits('1', poolPrice.baseCurrency?.decimals)),
        ),
      )
      .multiply(DECIMAL_SCALAR)
      .toFixed(0),
  )

  const difference = JSBI.lessThan(scaledMarketPrice, scaledPoolPrice)
    ? JSBI.subtract(scaledPoolPrice, scaledMarketPrice)
    : JSBI.subtract(scaledMarketPrice, scaledPoolPrice)

  const divergence = new Fraction(difference, scaledMarketPrice)

  return divergence.greaterThan(WARNING_THRESHOLD)
}
