import { NetworkStatus } from '@apollo/client'
import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query'
import { MixedRouteSDK, Trade as RouterSDKTrade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Route as V2RouteSDK } from '@uniswap/v2-sdk'
import { Route as V3RouteSDK } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { useDebounceWithStatus } from 'utilities/src/time/timing'
import { PollingInterval } from 'wallet/src/constants/misc'
import {
  MAX_AUTO_SLIPPAGE_TOLERANCE,
  MIN_AUTO_SLIPPAGE_TOLERANCE,
} from 'wallet/src/constants/transactions'
import { QuoteResponse } from 'wallet/src/data/tradingApi/__generated__/api'
import { isL2Chain, toSupportedChainId } from 'wallet/src/features/chains/utils'
import { useRouterQuote } from 'wallet/src/features/routing/hooks'
import { QuoteResult, SwapFee } from 'wallet/src/features/routing/types'
import { useUSDCValue } from 'wallet/src/features/routing/useUSDCPrice'
import { transformQuoteToTrade } from 'wallet/src/features/transactions/swap/routeUtils'
import {
  isClassicQuote,
  transformTradingApiResponseToTrade,
} from 'wallet/src/features/transactions/swap/tradingApi/utils'
import { clearStaleTrades } from 'wallet/src/features/transactions/swap/utils'
import { QuoteType } from 'wallet/src/features/transactions/utils'

// Response data from either legacy for trading api quote request
export type QuoteData =
  | { quote?: QuoteResult; quoteType: QuoteType.RoutingApi }
  | { quote?: QuoteResponse; quoteType: QuoteType.TradingApi }

// TODO: [MOB-238] use composition instead of inheritance
export class Trade<
  TInput extends Currency = Currency,
  TOutput extends Currency = Currency,
  TTradeType extends TradeType = TradeType
> extends RouterSDKTrade<TInput, TOutput, TTradeType> {
  readonly quoteData?: QuoteData
  readonly deadline?: number
  readonly slippageTolerance: number
  readonly swapFee?: SwapFee

  constructor({
    quoteData,
    deadline,
    slippageTolerance,
    swapFee,
    ...routes
  }: {
    readonly quoteData?: QuoteData
    readonly swapFee?: SwapFee
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
    this.quoteData = quoteData
    this.deadline = deadline
    this.slippageTolerance = slippageTolerance
    this.swapFee = swapFee
  }
}

export interface TradeWithStatus {
  loading: boolean
  error?: FetchBaseQueryError | SerializedError
  trade: null | Trade<Currency, Currency, TradeType>
  isFetching?: boolean
}

export interface UseTradeArgs {
  amountSpecified: Maybe<CurrencyAmount<Currency>>
  otherCurrency: Maybe<Currency>
  tradeType: TradeType
  pollingInterval?: PollingInterval
  customSlippageTolerance?: number
  isUSDQuote?: boolean
  sendPortionEnabled?: boolean
  skip?: boolean
}

export function useTrade(args: UseTradeArgs): TradeWithStatus {
  const {
    amountSpecified,
    otherCurrency,
    tradeType,
    pollingInterval,
    customSlippageTolerance,
    isUSDQuote,
    sendPortionEnabled,
    skip,
  } = args
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

  const { loading, networkStatus, error, data } = useRouterQuote({
    amountSpecified: amount,
    otherCurrency,
    tradeType,
    pollingInterval,
    customSlippageTolerance,
    isUSDQuote,
    sendPortionEnabled,
    skip,
  })

  return useMemo(() => {
    if (!data?.trade) {
      return { loading, error, trade: null }
    }

    const [currencyIn, currencyOut] =
      tradeType === TradeType.EXACT_INPUT
        ? [amount?.currency, otherCurrency]
        : [otherCurrency, amount?.currency]

    const trade = clearStaleTrades(data.trade, currencyIn, currencyOut)

    return {
      loading: (amountSpecified && isDebouncing) || loading,
      isFetching: networkStatus === NetworkStatus.poll,
      error,
      trade,
    }
  }, [
    data?.trade,
    loading,
    error,
    tradeType,
    amount?.currency,
    otherCurrency,
    amountSpecified,
    isDebouncing,
    networkStatus,
  ])
}

export function useSetTradeSlippage(
  trade: TradeWithStatus,
  userSetSlippage?: number
): { trade: TradeWithStatus; autoSlippageTolerance: number } {
  // Always calculate and return autoSlippageTolerance so the UI can warn user when custom slippage is set higher than auto slippage
  const autoSlippageTolerance = useCalculateAutoSlippage(trade?.trade)

  return useMemo(() => {
    // If the user has set a custom slippage, use that in the trade instead of the auto-slippage
    if (!trade.trade || userSetSlippage) {
      return { trade, autoSlippageTolerance }
    }

    const { loading, error, isFetching } = trade
    const { tradeType, deadline, quoteData, inputAmount, outputAmount } = trade.trade
    const tokenInIsNative = inputAmount.currency.isNative
    const tokenOutIsNative = outputAmount.currency.isNative

    if (!quoteData) {
      return { trade, autoSlippageTolerance }
    }

    // Based on the quote type, transform the quote data into a trade
    const newTrade =
      quoteData.quoteType === QuoteType.RoutingApi
        ? transformQuoteToTrade(
            tokenInIsNative,
            tokenOutIsNative,
            tradeType,
            deadline,
            autoSlippageTolerance,
            quoteData?.quote
          )
        : transformTradingApiResponseToTrade({
            tokenInIsNative,
            tokenOutIsNative,
            tradeType,
            deadline,
            slippageTolerance: autoSlippageTolerance,
            data: quoteData?.quote,
          })

    return {
      trade: {
        trade: newTrade,
        loading,
        error,
        isFetching,
      },
      autoSlippageTolerance,
    }
  }, [trade, userSetSlippage, autoSlippageTolerance])
}

/*
  Based on: https://github.com/Uniswap/interface/blob/1802f50163bf8092dac6916d64b9e08ac2ae0a74/src/hooks/useAutoSlippageTolerance.ts

  The rationale is the user will be happy so long as the expected "cost" of the slippage is less than
  theoretical cost incurred if the tx were to fail due to slippage being set too conservatively. Therefore,
  slippage is set to be (gas cost in $'s) / (expected swap output value in $'s).

  Note: not using BigNumber because it sucks at decimals and we're dealing with USD values anyways
 */
// TODO: move logic to `transformResponse` method of routingApi when endpoint returns output USD value
function useCalculateAutoSlippage(trade: Maybe<Trade>): number {
  // Enforce quote types
  const isLegacyQuote = trade?.quoteData?.quoteType === QuoteType.RoutingApi

  const outputAmountUSD = useUSDCValue(trade?.outputAmount)?.toExact()

  return useMemo<number>(() => {
    if (isLegacyQuote) {
      const chainId = trade.quoteData.quote?.route[0]?.[0]?.tokenIn?.chainId
      const onL2 = isL2Chain(chainId)
      const gasCostUSD = trade.quoteData.quote?.gasUseEstimateUSD
      return calculateAutoSlippage({ onL2, gasCostUSD, outputAmountUSD })
    } else {
      // TODO:api remove this during Uniswap X integration
      const quote = isClassicQuote(trade?.quoteData?.quote?.quote)
        ? trade?.quoteData?.quote?.quote
        : undefined
      const chainId = toSupportedChainId(quote?.chainId) ?? undefined
      const onL2 = isL2Chain(chainId)
      const gasCostUSD = quote?.gasFeeUSD
      return calculateAutoSlippage({ onL2, gasCostUSD, outputAmountUSD })
    }
  }, [isLegacyQuote, outputAmountUSD, trade])
}

function calculateAutoSlippage({
  onL2,
  gasCostUSD,
  outputAmountUSD,
}: {
  onL2: boolean
  gasCostUSD?: string
  outputAmountUSD?: string
}): number {
  if (onL2 || !gasCostUSD || !outputAmountUSD) {
    return MIN_AUTO_SLIPPAGE_TOLERANCE
  }

  const suggestedSlippageTolerance = (Number(gasCostUSD) / Number(outputAmountUSD)) * 100

  if (suggestedSlippageTolerance > MAX_AUTO_SLIPPAGE_TOLERANCE) {
    return MAX_AUTO_SLIPPAGE_TOLERANCE
  }

  if (suggestedSlippageTolerance < MIN_AUTO_SLIPPAGE_TOLERANCE) {
    return MIN_AUTO_SLIPPAGE_TOLERANCE
  }

  return Number(suggestedSlippageTolerance.toFixed(2))
}
