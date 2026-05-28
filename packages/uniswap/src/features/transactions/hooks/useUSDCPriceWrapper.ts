/**
 * Feature-flag wrapper for USDC price hooks.
 *
 * Delegates to the implementation provided by TokenPriceContext,
 * which switches between legacy and centralized based on a feature flag.
 * Only the selected implementation is called — no overfetching.
 */
import type { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useTokenPriceHooks } from 'uniswap/src/features/prices/TokenPriceContext'

export function useUSDCPrice(
  currency?: Currency,
  pollInterval: PollingInterval = PollingInterval.Fast,
): {
  price: Price<Currency, Currency> | undefined
  isLoading: boolean
} {
  return useTokenPriceHooks().useUSDCPrice(currency, pollInterval)
}

export function useUSDCValue(
  currencyAmount: CurrencyAmount<Currency> | undefined | null,
  pollInterval: PollingInterval = PollingInterval.Fast,
): CurrencyAmount<Currency> | null {
  return useTokenPriceHooks().useUSDCValue(currencyAmount, pollInterval)
}

export function useUSDCValueWithStatus(
  currencyAmount: CurrencyAmount<Currency> | undefined | null,
  pollInterval: PollingInterval = PollingInterval.Fast,
): {
  value: CurrencyAmount<Currency> | null
  isLoading: boolean
} {
  return useTokenPriceHooks().useUSDCValueWithStatus(currencyAmount, pollInterval)
}
