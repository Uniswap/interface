import 'setimmediate'

import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import useDebounce from 'hooks/useDebounce'
import { useStablecoinAmountFromFiatValue } from 'hooks/useUSDCPrice'
import { useCallback, useMemo } from 'react'
import { GetQuoteResult, InterfaceTrade, TradeState } from 'state/routing/types'
import { computeRoutes, transformRoutesToTrade } from 'state/routing/utils'

import useWrapCallback, { WrapType } from '../swap/useWrapCallback'
import useActiveWeb3React from '../useActiveWeb3React'
import { useGetIsValidBlock } from '../useIsValidBlock'
import usePoll from '../usePoll'
import { useRoutingAPIArguments } from './useRoutingAPIArguments'

/**
 * Reduces client-side latency by increasing the minimum percentage of the input token to use for each route in a split route while SOR is used client-side.
 * Defaults are defined in https://github.com/Uniswap/smart-order-router/blob/309e6f6603984d3b5aef0733b0cfaf129c29f602/src/routers/alpha-router/config.ts#L83.
 */
const DistributionPercents: { [key: number]: number } = {
  [SupportedChainId.MAINNET]: 10,
  [SupportedChainId.OPTIMISM]: 10,
  [SupportedChainId.OPTIMISTIC_KOVAN]: 10,
  [SupportedChainId.ARBITRUM_ONE]: 25,
  [SupportedChainId.ARBITRUM_RINKEBY]: 25,
}
const DEFAULT_DISTRIBUTION_PERCENT = 10
function getConfig(chainId: SupportedChainId | undefined) {
  return {
    // Limit to only V2 and V3.
    protocols: [Protocol.V2, Protocol.V3],
    distributionPercent: (chainId && DistributionPercents[chainId]) ?? DEFAULT_DISTRIBUTION_PERCENT,
  }
}

export default function useClientSideSmartOrderRouterTrade<TTradeType extends TradeType>(
  tradeType: TTradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: TradeState
  trade: InterfaceTrade<Currency, Currency, TTradeType> | undefined
} {
  const amount = useMemo(() => amountSpecified?.asFraction, [amountSpecified])
  const [currencyIn, currencyOut] =
    tradeType === TradeType.EXACT_INPUT
      ? [amountSpecified?.currency, otherCurrency]
      : [otherCurrency, amountSpecified?.currency]

  // Debounce is used to prevent excessive requests to SOR, as it is data intensive.
  // Fast user actions (ie updating the input) should be debounced, but currency changes should not.
  const [debouncedAmount, debouncedCurrencyIn, debouncedCurrencyOut] = useDebounce(
    useMemo(() => [amount, currencyIn, currencyOut], [amount, currencyIn, currencyOut]),
    200
  )
  const isDebouncing =
    amount !== debouncedAmount && currencyIn === debouncedCurrencyIn && currencyOut === debouncedCurrencyOut

  const queryArgs = useRoutingAPIArguments({
    tokenIn: currencyIn,
    tokenOut: currencyOut,
    amount: amountSpecified,
    tradeType,
    useClientSideRouter: true,
  })
  const chainId = amountSpecified?.currency.chainId
  const { library } = useActiveWeb3React()
  const params = useMemo(() => chainId && library && { chainId, provider: library }, [chainId, library])
  const config = useMemo(() => getConfig(chainId), [chainId])
  const { type: wrapType } = useWrapCallback()

  const getQuoteResult = useCallback(async (): Promise<{ data?: GetQuoteResult; error?: unknown }> => {
    if (wrapType !== WrapType.NONE) return { error: undefined }
    if (!queryArgs || !params) return { error: undefined }
    try {
      // Lazy-load the smart order router to improve initial pageload times.
      const quoteResult = await (
        await import('./clientSideSmartOrderRouter')
      ).getClientSideQuote(queryArgs, params, config)

      // There is significant post-fetch processing, so delay a tick to prevent dropped frames.
      // This is only important in the context of integrations - if we control the whole site,
      // then we can afford to drop a few frames.
      return new Promise((resolve) => setImmediate(() => resolve(quoteResult)))
    } catch {
      return { error: true }
    }
  }, [config, params, queryArgs, wrapType])

  const getIsValidBlock = useGetIsValidBlock()
  const { data: quoteResult, error } = usePoll(getQuoteResult, JSON.stringify(queryArgs), {
    debounce: isDebouncing,
    isStale: useCallback(({ data }) => !getIsValidBlock(Number(data?.blockNumber) || 0), [getIsValidBlock]),
  }) ?? {
    error: undefined,
  }
  const isValid = getIsValidBlock(Number(quoteResult?.blockNumber) || 0)

  const route = useMemo(
    () => computeRoutes(currencyIn, currencyOut, tradeType, quoteResult),
    [currencyIn, currencyOut, quoteResult, tradeType]
  )
  const gasUseEstimateUSD = useStablecoinAmountFromFiatValue(quoteResult?.gasUseEstimateUSD) ?? null
  const trade = useMemo(() => {
    if (route) {
      try {
        return route && transformRoutesToTrade(route, tradeType, gasUseEstimateUSD)
      } catch (e: unknown) {
        console.debug('transformRoutesToTrade failed: ', e)
      }
    }
    return
  }, [gasUseEstimateUSD, route, tradeType])

  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return { state: TradeState.INVALID, trade: undefined }
    }

    if (!trade && !error) {
      if (isDebouncing) {
        return { state: TradeState.SYNCING, trade: undefined }
      } else if (!isValid) {
        return { state: TradeState.LOADING, trade: undefined }
      }
    }

    let otherAmount = undefined
    if (quoteResult) {
      switch (tradeType) {
        case TradeType.EXACT_INPUT:
          otherAmount = CurrencyAmount.fromRawAmount(currencyOut, quoteResult.quote)
          break
        case TradeType.EXACT_OUTPUT:
          otherAmount = CurrencyAmount.fromRawAmount(currencyIn, quoteResult.quote)
          break
      }
    }

    if (error || !otherAmount || !route || route.length === 0) {
      return { state: TradeState.NO_ROUTE_FOUND, trade: undefined }
    }

    if (trade) {
      return { state: TradeState.VALID, trade }
    }
    return { state: TradeState.INVALID, trade: undefined }
  }, [currencyIn, currencyOut, trade, error, isValid, quoteResult, route, isDebouncing, tradeType])
}
