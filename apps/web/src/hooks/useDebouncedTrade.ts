import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import useDebounce from 'hooks/useDebounce'
import { useAtomValue } from 'jotai/utils'
import { routingPreferencesAtom } from 'pages/MigrateV2/Settings/MultipleRoutingOptions'
import { useMemo } from 'react'
import { ClassicTrade, InterfaceTrade, QuoteMethod, RouterPreference, TradeState } from 'state/routing/types'
import { usePreviewTrade } from 'state/routing/usePreviewTrade'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'
import { useRouterPreference } from 'state/user/hooks'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

// Prevents excessive quote requests between keystrokes.
const DEBOUNCE_TIME = 350
const DEBOUNCE_TIME_QUICKROUTE = 50

export function useDebouncedTrade(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency,
  routerPreferenceOverride?: RouterPreference.X,
  account?: string,
  inputTax?: Percent,
  outputTax?: Percent,
): {
  state: TradeState
  trade?: InterfaceTrade
  swapQuoteLatency?: number
}

export function useDebouncedTrade(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency,
  routerPreferenceOverride?: RouterPreference.API,
  account?: string,
  inputTax?: Percent,
  outputTax?: Percent,
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
  outputTax?: Percent,
): {
  state: TradeState
  trade?: InterfaceTrade
  method?: QuoteMethod
  swapQuoteLatency?: number
} {
  const { chainId } = useAccount()

  const inputs = useMemo<[CurrencyAmount<Currency> | undefined, Currency | undefined]>(
    () => [amountSpecified, otherCurrency],
    [amountSpecified, otherCurrency],
  )
  const isDebouncing = useDebounce(inputs, DEBOUNCE_TIME) !== inputs

  const isPreviewTradeDebouncing = useDebounce(inputs, DEBOUNCE_TIME_QUICKROUTE) !== inputs

  const isWrap = useMemo(() => {
    if (!chainId || !amountSpecified || !otherCurrency) {
      return false
    }
    const weth = WRAPPED_NATIVE_CURRENCY[chainId]
    return Boolean(
      (amountSpecified.currency.isNative && weth?.equals(otherCurrency)) ||
        (otherCurrency.isNative && weth?.equals(amountSpecified.currency)),
    )
  }, [amountSpecified, chainId, otherCurrency])

  const [routerPreference] = useRouterPreference()
  const multipleRouteOptionsEnabled = useFeatureFlag(FeatureFlags.MultipleRoutingOptions)
  const multipleRouteOptionsRoutingPreference = useAtomValue(routingPreferencesAtom)
  const routingPreference = multipleRouteOptionsEnabled ? multipleRouteOptionsRoutingPreference : undefined

  const skipBothFetches = isWrap
  const skipRoutingFetch = skipBothFetches || isDebouncing

  const skipPreviewTradeFetch = skipBothFetches || isPreviewTradeDebouncing

  const previewTradeResult = usePreviewTrade(
    skipPreviewTradeFetch,
    tradeType,
    amountSpecified,
    otherCurrency,
    inputTax,
    outputTax,
  )
  const routingApiTradeResult = useRoutingAPITrade(
    skipRoutingFetch,
    tradeType,
    amountSpecified,
    otherCurrency,
    routerPreferenceOverride ?? routingPreference?.router ?? routerPreference,
    account,
    routingPreference?.protocols,
    inputTax,
    outputTax,
  )

  return previewTradeResult.currentTrade && !routingApiTradeResult.currentTrade
    ? previewTradeResult
    : routingApiTradeResult
}
