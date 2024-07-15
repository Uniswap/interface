import { SkipToken, skipToken } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { GetQuoteArgs, INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference } from 'state/routing/types'
import { currencyAddressForSwapQuote } from 'state/routing/utils'
import { ArbitrumXV2OpenOrderProperties, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useExperimentGroupName, useExperimentValue, useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'

enum ArbitrumXV2ExperimentGroup {
  Test = 'Test',
  Control = 'Control',
}

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
  const isXv2 = useFeatureFlag(FeatureFlags.UniswapXv2)
  const xv2ArbitrumEnabled =
    useExperimentGroupName(Experiments.ArbitrumXV2OpenOrders) === ArbitrumXV2ExperimentGroup.Test
  const isXv2Arbitrum = tokenIn?.chainId === UniverseChainId.ArbitrumOne && xv2ArbitrumEnabled
  const priceImprovementBps = useExperimentValue(
    Experiments.ArbitrumXV2OpenOrders,
    ArbitrumXV2OpenOrderProperties.PriceImprovementBps,
    0,
  )
  const forceOpenOrders = useExperimentValue(
    Experiments.ArbitrumXV2OpenOrders,
    ArbitrumXV2OpenOrderProperties.ForceOpenOrders,
    false,
  )
  const deadlineBufferSecs = useExperimentValue(
    Experiments.ArbitrumXV2OpenOrders,
    ArbitrumXV2OpenOrderProperties.DeadlineBufferSecs,
    30,
  )
  // Don't enable fee logic if this is a quote for pricing
  const sendPortionEnabled = routerPreference !== INTERNAL_ROUTER_PREFERENCE_PRICE

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
            isXv2,
            isXv2Arbitrum,
            priceImprovementBps,
            forceOpenOrders,
            deadlineBufferSecs,
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
      isXv2,
      isXv2Arbitrum,
      priceImprovementBps,
      forceOpenOrders,
      deadlineBufferSecs,
    ],
  )
}
