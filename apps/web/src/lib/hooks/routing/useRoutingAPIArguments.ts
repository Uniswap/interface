import { SkipToken, skipToken } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useIsUniswapXSupportedChain } from 'hooks/useIsUniswapXSupportedChain'
import { useMemo } from 'react'
import { GetQuoteArgs, INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference, URAQuoteType } from 'state/routing/types'
import { currencyAddressForSwapQuote } from 'state/routing/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useUniswapXPriorityOrderFlag } from 'uniswap/src/features/transactions/swap/utils/protocols'

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
  protocolPreferences,
}: {
  account?: string
  tokenIn?: Currency
  tokenOut?: Currency
  amount?: CurrencyAmount<Currency>
  tradeType: TradeType
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE
  protocolPreferences?: Protocol[]
}): GetQuoteArgs | SkipToken {
  const uniswapXForceSyntheticQuotes = useFeatureFlag(FeatureFlags.UniswapXSyntheticQuote)
  const isPriorityOrdersEnabled = useUniswapXPriorityOrderFlag(tokenIn?.chainId)
  const isXv2 = useFeatureFlag(FeatureFlags.UniswapXv2)
  const isDutchV3Enabled = useFeatureFlag(FeatureFlags.ArbitrumDutchV3)

  // Don't enable fee logic if this is a quote for pricing
  const sendPortionEnabled = routerPreference !== INTERNAL_ROUTER_PREFERENCE_PRICE

  const chainId = tokenIn?.chainId
  const isUniswapXSupportedChain = useIsUniswapXSupportedChain(chainId)
  const isPriorityOrder = routerPreference === RouterPreference.X && isPriorityOrdersEnabled
  const isArbitrum = tokenIn?.chainId === UniverseChainId.ArbitrumOne

  const routingType = isUniswapXSupportedChain
    ? isPriorityOrder
      ? URAQuoteType.PRIORITY
      : isArbitrum
        ? isDutchV3Enabled
          ? URAQuoteType.DUTCH_V3
          : URAQuoteType.DUTCH_V1
        : isXv2
          ? URAQuoteType.DUTCH_V2
          : URAQuoteType.DUTCH_V1
    : URAQuoteType.CLASSIC

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
            protocolPreferences,
            tradeType,
            needsWrapIfUniswapX: tokenIn.isNative,
            uniswapXForceSyntheticQuotes,
            sendPortionEnabled,
            routingType,
          },
    [
      tokenIn,
      tokenOut,
      amount,
      account,
      routerPreference,
      protocolPreferences,
      tradeType,
      uniswapXForceSyntheticQuotes,
      sendPortionEnabled,
      routingType,
    ],
  )
}
