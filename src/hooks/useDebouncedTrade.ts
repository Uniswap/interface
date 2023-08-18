import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { DebounceSwapQuoteVariant, useDebounceSwapQuoteFlag } from 'featureFlags/flags/debounceSwapQuote'
import { useMemo } from 'react'
import { ClassicTrade, InterfaceTrade, QuoteMethod, RouterPreference, TradeState } from 'state/routing/types'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'
import { useRouterPreference } from 'state/user/hooks'

import useAutoRouterSupported from './useAutoRouterSupported'
import useDebounce from './useDebounce'
import useIsWindowVisible from './useIsWindowVisible'

// Prevents excessive quote requests between keystrokes.
const DEBOUNCE_TIME = 350

// Temporary until we remove the feature flag.
const DEBOUNCE_TIME_INCREASED = 650

export function useDebouncedTrade(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency,
  routerPreferenceOverride?: RouterPreference.X,
  account?: string
): {
  state: TradeState
  trade?: InterfaceTrade
  swapQuoteLatency?: number
}

export function useDebouncedTrade(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency,
  routerPreferenceOverride?: RouterPreference.API | RouterPreference.CLIENT,
  account?: string
): {
  state: TradeState
  trade?: ClassicTrade
  swapQuoteLatency?: number
}
/**
 * Returns the debounced v2+v3 trade for a desired swap.
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 * @param routerPreferenceOverride force useRoutingAPITrade to use a specific RouterPreference
 * @param account the connected address
 *
 */
export function useDebouncedTrade(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency,
  routerPreferenceOverride?: RouterPreference,
  account?: string
): {
  state: TradeState
  trade?: InterfaceTrade
  method?: QuoteMethod
  swapQuoteLatency?: number
} {
  const { chainId } = useWeb3React()
  const autoRouterSupported = useAutoRouterSupported()
  const isWindowVisible = useIsWindowVisible()

  const inputs = useMemo<[CurrencyAmount<Currency> | undefined, Currency | undefined]>(
    () => [amountSpecified, otherCurrency],
    [amountSpecified, otherCurrency]
  )
  const debouncedSwapQuoteFlagEnabled = useDebounceSwapQuoteFlag() === DebounceSwapQuoteVariant.Enabled
  const debouncedInputs = useDebounce(inputs, debouncedSwapQuoteFlagEnabled ? DEBOUNCE_TIME_INCREASED : DEBOUNCE_TIME)
  const isDebouncing = debouncedInputs !== inputs
  const [debouncedAmount, debouncedOtherCurrency] = debouncedInputs

  const isWrap = useMemo(() => {
    if (!chainId || !amountSpecified || !debouncedOtherCurrency) return false
    const weth = WRAPPED_NATIVE_CURRENCY[chainId]
    return (
      (amountSpecified.currency.isNative && weth?.equals(debouncedOtherCurrency)) ||
      (debouncedOtherCurrency.isNative && weth?.equals(amountSpecified.currency))
    )
  }, [amountSpecified, chainId, debouncedOtherCurrency])

  const shouldGetTrade = !isWrap && isWindowVisible

  const [routerPreference] = useRouterPreference()
  const routingAPITrade = useRoutingAPITrade(
    tradeType,
    amountSpecified ? debouncedAmount : undefined,
    debouncedOtherCurrency,
    routerPreferenceOverride ?? routerPreference,
    !(autoRouterSupported && shouldGetTrade), // skip fetching
    account
  )

  // If the user is debouncing, we want to show the loading state until the debounce is complete.
  const isLoading = (routingAPITrade.state === TradeState.LOADING || isDebouncing) && !isWrap

  return useMemo(
    () => ({
      ...routingAPITrade,
      ...(isLoading ? { state: TradeState.LOADING } : {}),
    }),
    [isLoading, routingAPITrade]
  )
}
