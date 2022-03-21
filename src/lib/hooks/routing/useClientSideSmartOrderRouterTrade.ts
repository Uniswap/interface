import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { ChainId } from '@uniswap/smart-order-router'
import useDebounce from 'hooks/useDebounce'
import useLast from 'hooks/useLast'
import { useStablecoinAmountFromFiatValue } from 'hooks/useUSDCPrice'
import { useCallback, useMemo } from 'react'
import { GetQuoteResult, InterfaceTrade, TradeState } from 'state/routing/types'
import { computeRoutes, transformRoutesToTrade } from 'state/routing/utils'

import useWrapCallback, { WrapType } from '../swap/useWrapCallback'
import useActiveWeb3React from '../useActiveWeb3React'
import { useGetIsValidBlock } from '../useIsValidBlock'
import usePoll from '../usePoll'
import { getClientSideQuote } from './clientSideSmartOrderRouter'
import { useRoutingAPIArguments } from './useRoutingAPIArguments'

/**
 * Reduces client-side latency by increasing the minimum percentage of the input token to use for each route in a split route while SOR is used client-side.
 * Defaults are defined in https://github.com/Uniswap/smart-order-router/blob/309e6f6603984d3b5aef0733b0cfaf129c29f602/src/routers/alpha-router/config.ts#L83.
 */
const DistributionPercents: { [key: number]: number } = {
  [ChainId.MAINNET]: 10,
  [ChainId.OPTIMISM]: 10,
  [ChainId.OPTIMISTIC_KOVAN]: 10,
  [ChainId.ARBITRUM_ONE]: 25,
  [ChainId.ARBITRUM_RINKEBY]: 25,
}
const DEFAULT_DISTRIBUTION_PERCENT = 10
function getConfig(chainId: ChainId | undefined) {
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
    if (wrapType !== WrapType.NOT_APPLICABLE) return { error: undefined }
    if (!queryArgs || !params) return { error: undefined }
    try {
      return await getClientSideQuote(queryArgs, params, config)
    } catch {
      return { error: true }
    }
  }, [config, params, queryArgs, wrapType])

  const getIsValidBlock = useGetIsValidBlock()
  const { data: quoteResult, error } = usePoll(getQuoteResult, JSON.stringify(queryArgs), {
    debounce: isDebouncing,
    staleCallback: useCallback(({ data }) => getIsValidBlock(Number(data?.blockNumber) || 0), [getIsValidBlock]),
  }) ?? {
    error: undefined,
  }
  const isLoading = !quoteResult

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
  const lastTrade = useLast(trade, Boolean) ?? undefined

  // Dont return old trade if currencies dont match.
  const isStale =
    (currencyIn && !trade?.inputAmount?.currency.equals(currencyIn)) ||
    (currencyOut && !trade?.outputAmount?.currency.equals(currencyOut))

  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return { state: TradeState.INVALID, trade: undefined }
    }

    // Returns the last trade state while syncing/loading to avoid jank from clearing the last trade while loading.
    if (!quoteResult && !error) {
      if (isStale) {
        return { state: TradeState.LOADING, trade: undefined }
      } else if (isDebouncing) {
        return { state: TradeState.SYNCING, trade: lastTrade }
      } else if (isLoading) {
        return { state: TradeState.LOADING, trade: lastTrade }
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

    if (error || !otherAmount || !route || route.length === 0 || !queryArgs) {
      return { state: TradeState.NO_ROUTE_FOUND, trade: undefined }
    }

    if (trade) {
      return { state: TradeState.VALID, trade }
    }
    return { state: TradeState.INVALID, trade: undefined }
  }, [
    currencyIn,
    currencyOut,
    quoteResult,
    error,
    route,
    queryArgs,
    trade,
    isStale,
    isDebouncing,
    isLoading,
    lastTrade,
    tradeType,
  ])
}
