import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query'
import { MixedRouteSDK, Trade as RouterSDKTrade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Route as V2RouteSDK } from '@uniswap/v2-sdk'
import { Route as V3RouteSDK } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { isL2Chain } from 'src/constants/chains'
import { PollingInterval } from 'src/constants/misc'
import {
  MAX_AUTO_SLIPPAGE_TOLERANCE,
  MIN_AUTO_SLIPPAGE_TOLERANCE,
} from 'src/constants/transactions'
import { useRouterQuote } from 'src/features/routing/hooks'
import { QuoteResult } from 'src/features/routing/types'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { transformQuoteToTrade } from 'src/features/transactions/swap/routeUtils'
import { clearStaleTrades } from 'src/features/transactions/swap/utils'
import { useDebounceWithStatus } from 'src/utils/timing'

// TODO: [MOB-3906] use composition instead of inheritance
export class Trade<
  TInput extends Currency = Currency,
  TOutput extends Currency = Currency,
  TTradeType extends TradeType = TradeType
> extends RouterSDKTrade<TInput, TOutput, TTradeType> {
  readonly quote?: QuoteResult
  readonly deadline?: number
  readonly slippageTolerance: number

  constructor({
    quote,
    deadline,
    slippageTolerance,
    ...routes
  }: {
    readonly quote?: QuoteResult
    readonly deadline?: number
    readonly slippageTolerance: number
    readonly v2Routes: {
      routev2: V2RouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    readonly v3Routes: {
      routev3: V3RouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    readonly mixedRoutes: {
      mixedRoute: MixedRouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    readonly tradeType: TTradeType
  }) {
    super(routes)
    this.quote = quote
    this.deadline = deadline
    this.slippageTolerance = slippageTolerance
  }
}

interface TradeWithStatus {
  loading: boolean
  error?: FetchBaseQueryError | SerializedError
  trade: null | Trade<Currency, Currency, TradeType>
  isFetching?: boolean
}

interface UseTradeArgs {
  amountSpecified: NullUndefined<CurrencyAmount<Currency>>
  otherCurrency: NullUndefined<Currency>
  tradeType: TradeType
  pollingInterval?: PollingInterval
  slippageTolerance?: number
}

export function useTrade(args: UseTradeArgs): TradeWithStatus {
  const { amountSpecified, otherCurrency, tradeType, pollingInterval, slippageTolerance } = args
  const [debouncedAmountSpecified, isDebouncing] = useDebounceWithStatus(amountSpecified)

  /*
    1. if user clears input (amountSpecified is null or undefined), immediately use that
    instead of the debounced value so that there's no lingering loading state on empty inputs

    2. if user changes networks, also immediately use that so there's no mismatch between
    chains for input/output currencies
  */
  const shouldDebounce =
    amountSpecified && debouncedAmountSpecified?.currency.chainId === otherCurrency?.chainId

  const amount = shouldDebounce ? debouncedAmountSpecified : amountSpecified

  const { isLoading, isFetching, error, data } = useRouterQuote({
    amountSpecified: amount,
    otherCurrency,
    tradeType,
    pollingInterval,
    slippageTolerance,
  })

  return useMemo(() => {
    if (!data?.trade) return { loading: isLoading, error, trade: null }

    const [currencyIn, currencyOut] =
      tradeType === TradeType.EXACT_INPUT
        ? [amount?.currency, otherCurrency]
        : [otherCurrency, amount?.currency]

    const trade = clearStaleTrades(data.trade, currencyIn, currencyOut)

    return {
      loading: (amountSpecified && isDebouncing) || isLoading,
      isFetching,
      error,
      trade,
    }
  }, [
    data?.trade,
    isLoading,
    error,
    tradeType,
    amount?.currency,
    otherCurrency,
    amountSpecified,
    isDebouncing,
    isFetching,
  ])
}

export function useSetTradeSlippage(
  trade: TradeWithStatus,
  userSetSlippage?: number
): TradeWithStatus {
  const autoSlippageTolerance = useAutoSlippageTolerance(trade?.trade)
  return useMemo(() => {
    if (!trade.trade) return trade

    if (autoSlippageTolerance && userSetSlippage === undefined) {
      const { loading, error, isFetching } = trade
      const { tradeType, deadline, quote, inputAmount, outputAmount } = trade.trade
      const tokenInIsNative = inputAmount.currency.isNative
      const tokenOutIsNative = outputAmount.currency.isNative

      const newTrade = transformQuoteToTrade(
        tokenInIsNative,
        tokenOutIsNative,
        tradeType,
        deadline,
        autoSlippageTolerance,
        quote
      )

      return {
        trade: newTrade,
        loading,
        error,
        isFetching,
      }
    }

    return trade
  }, [trade, autoSlippageTolerance, userSetSlippage])
}

/*
  Based on: https://github.com/Uniswap/interface/blob/1802f50163bf8092dac6916d64b9e08ac2ae0a74/src/hooks/useAutoSlippageTolerance.ts

  The rationale is the user will be happy so long as the expected "cost" of the slippage is less than
  theoretical cost incurred if the tx were to fail due to slippage being set too conservatively. Therefore,
  slippage is set to be (gas cost in $'s) / (expected swap output value in $'s).

  Note: not using BigNumber because it sucks at decimals and we're dealing with USD values anyways
 */
// TODO: move logic to `transformResponse` method of routingApi when endpoint returns output USD value
function useAutoSlippageTolerance(trade: NullUndefined<Trade>): number {
  const chainId = trade?.quote?.route?.[0]?.[0]?.tokenIn.chainId
  const gasCostUSD = trade?.quote?.gasUseEstimateUSD
  const outputAmountUSD = useUSDCValue(trade?.outputAmount)?.toExact()

  return useMemo(() => {
    const onL2 = isL2Chain(chainId)
    if (onL2 || !gasCostUSD || !outputAmountUSD) return MIN_AUTO_SLIPPAGE_TOLERANCE

    const suggestedSlippageTolerance = (Number(gasCostUSD) / Number(outputAmountUSD)) * 100

    if (suggestedSlippageTolerance > MAX_AUTO_SLIPPAGE_TOLERANCE) {
      return MAX_AUTO_SLIPPAGE_TOLERANCE
    }

    if (suggestedSlippageTolerance < MIN_AUTO_SLIPPAGE_TOLERANCE) {
      return MIN_AUTO_SLIPPAGE_TOLERANCE
    }

    return Number(suggestedSlippageTolerance.toFixed(2))
  }, [chainId, gasCostUSD, outputAmountUSD])
}
