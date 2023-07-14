import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useRoutingAPIForPrice } from 'featureFlags/flags/priceRoutingApi'
import { useUniswapXEnabled } from 'featureFlags/flags/uniswapx'
import { useUniswapXSyntheticQuoteEnabled } from 'featureFlags/flags/uniswapXUseSyntheticQuote'
import { useMemo } from 'react'
import { GetQuoteArgs, INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference } from 'state/routing/slice'
import { currencyAddressForSwapQuote } from 'state/routing/utils'

/**
 * Returns query arguments for the Routing API query or undefined if the
 * query should be skipped. Input arguments do not need to be memoized, as they will
 * be destructured.
 */
export function useRoutingAPIArguments({
  account,
  tokenIn,
  tokenOut,
  amount,
  tradeType,
  routerPreference,
}: {
  account?: string
  tokenIn?: Currency
  tokenOut?: Currency
  amount?: CurrencyAmount<Currency>
  tradeType: TradeType
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE
}): GetQuoteArgs | undefined {
  const uniswapXEnabled = useUniswapXEnabled()
  const uniswapXForceSyntheticQuotes = useUniswapXSyntheticQuoteEnabled()
  const isRoutingAPIPrice = useRoutingAPIForPrice()

  return useMemo(
    () =>
      !tokenIn || !tokenOut || !amount || tokenIn.equals(tokenOut) || tokenIn.wrapped.equals(tokenOut.wrapped)
        ? undefined
        : {
            account,
            amount: amount.quotient.toString(),
            tokenInAddress: currencyAddressForSwapQuote(tokenIn),
            tokenInChainId: tokenIn.chainId,
            tokenInDecimals: tokenIn.wrapped.decimals,
            tokenInSymbol: tokenIn.wrapped.symbol,
            tokenOutAddress: currencyAddressForSwapQuote(tokenOut),
            tokenOutChainId: tokenOut.wrapped.chainId,
            tokenOutDecimals: tokenOut.wrapped.decimals,
            tokenOutSymbol: tokenOut.wrapped.symbol,
            routerPreference,
            tradeType,
            isRoutingAPIPrice,
            needsWrapIfUniswapX: tokenIn.isNative,
            uniswapXEnabled,
            uniswapXForceSyntheticQuotes,
          },
    [
      account,
      amount,
      routerPreference,
      tokenIn,
      tokenOut,
      tradeType,
      uniswapXEnabled,
      isRoutingAPIPrice,
      uniswapXForceSyntheticQuotes,
    ]
  )
}
