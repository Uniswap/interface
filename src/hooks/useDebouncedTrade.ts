import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { DebounceSwapQuoteVariant, useDebounceSwapQuoteFlag } from 'featureFlags/flags/debounceSwapQuote'
import { useMemo } from 'react'
import { ClassicTrade, InterfaceTrade, QuoteMethod, RouterPreference, TradeState } from 'state/routing/types'
import { usePreviewTrade } from 'state/routing/usePreviewTrade'
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
  account?: string,
  inputTax?: Percent,
  outputTax?: Percent
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
  account?: string,
  inputTax?: Percent,
  outputTax?: Percent
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
  account?: string,
  inputTax?: Percent,
  outputTax?: Percent
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
  const isDebouncing =
    useDebounce(inputs, debouncedSwapQuoteFlagEnabled ? DEBOUNCE_TIME_INCREASED : DEBOUNCE_TIME) !== inputs

  // const isPreviewTradeDebouncing = useDebounce(inputs, 100) !== inputs

  const isWrap = useMemo(() => {
    if (!chainId || !amountSpecified || !otherCurrency) return false
    const weth = WRAPPED_NATIVE_CURRENCY[chainId]
    return Boolean(
      (amountSpecified.currency.isNative && weth?.equals(otherCurrency)) ||
        (otherCurrency.isNative && weth?.equals(amountSpecified.currency))
    )
  }, [amountSpecified, chainId, otherCurrency])

  const [routerPreference] = useRouterPreference()

  const skipRoutingFetch = isDebouncing || !autoRouterSupported || !isWindowVisible || isWrap
  const skipPreviewTradeFetch =
    !autoRouterSupported || !isWindowVisible || isWrap || routerPreference === RouterPreference.CLIENT

  const previewTradeResult = usePreviewTrade(
    skipPreviewTradeFetch,
    tradeType,
    amountSpecified,
    otherCurrency,
    inputTax,
    outputTax
  )
  const routingApiTradeResult = useRoutingAPITrade(
    skipRoutingFetch,
    tradeType,
    amountSpecified,
    otherCurrency,
    routerPreferenceOverride ?? routerPreference,
    account,
    inputTax,
    outputTax
  )

  return useMemo(() => {
    if (!previewTradeResult.currentTrade && !routingApiTradeResult.currentTrade) {
      console.log('no trade results from either', previewTradeResult.state, routingApiTradeResult.state)
    }
    // only show PreviewTrade if the more comprehensive routing-api request hasn't come back yet
    if (previewTradeResult.currentTrade && !routingApiTradeResult.currentTrade) {
      console.log('✅showing preview trade')
      return { ...previewTradeResult, state: TradeState.LOADING }
    } else if (routingApiTradeResult.currentTrade) {
      console.log('showing regular trade: ', routingApiTradeResult.currentTrade.outputAmount.quotient.toString())
    }

    return routingApiTradeResult
  }, [previewTradeResult, routingApiTradeResult])
}
