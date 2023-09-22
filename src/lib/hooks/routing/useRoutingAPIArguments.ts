import { SkipToken, skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { useUniswapXDefaultEnabled } from 'featureFlags/flags/uniswapXDefault'
import { useUniswapXEthOutputEnabled } from 'featureFlags/flags/uniswapXEthOutput'
import { useUniswapXExactOutputEnabled } from 'featureFlags/flags/uniswapXExactOutput'
import { useUniswapXSyntheticQuoteEnabled } from 'featureFlags/flags/uniswapXUseSyntheticQuote'
import { useMemo } from 'react'
import { GetQuoteArgs, INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference } from 'state/routing/types'
import { currencyAddressForSwapQuote } from 'state/routing/utils'
import { useUserDisabledUniswapX, useUserOptedOutOfUniswapX } from 'state/user/hooks'

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
  inputTax,
  outputTax,
}: {
  account?: string
  tokenIn?: Currency
  tokenOut?: Currency
  amount?: CurrencyAmount<Currency>
  tradeType: TradeType
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE
  inputTax: Percent
  outputTax: Percent
}): GetQuoteArgs | SkipToken {
  const uniswapXForceSyntheticQuotes = useUniswapXSyntheticQuoteEnabled()
  const userDisabledUniswapX = useUserDisabledUniswapX()
  const userOptedOutOfUniswapX = useUserOptedOutOfUniswapX()
  const uniswapXEthOutputEnabled = useUniswapXEthOutputEnabled()
  const uniswapXExactOutputEnabled = useUniswapXExactOutputEnabled()
  const isUniswapXDefaultEnabled = useUniswapXDefaultEnabled()

  return useMemo(
    () =>
      !tokenIn || !tokenOut || !amount || tokenIn.equals(tokenOut) || tokenIn.wrapped.equals(tokenOut.wrapped)
        ? skipToken
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
            needsWrapIfUniswapX: tokenIn.isNative,
            uniswapXForceSyntheticQuotes,
            userDisabledUniswapX,
            userOptedOutOfUniswapX,
            uniswapXEthOutputEnabled,
            uniswapXExactOutputEnabled,
            isUniswapXDefaultEnabled,
            inputTax,
            outputTax,
          },
    [
      account,
      amount,
      routerPreference,
      tokenIn,
      tokenOut,
      tradeType,
      uniswapXExactOutputEnabled,
      uniswapXForceSyntheticQuotes,
      userDisabledUniswapX,
      userOptedOutOfUniswapX,
      uniswapXEthOutputEnabled,
      isUniswapXDefaultEnabled,
      inputTax,
      outputTax,
    ]
  )
}
