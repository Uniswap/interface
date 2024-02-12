import { ApolloError, NetworkStatus } from '@apollo/client'
import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { useDebounceWithStatus } from 'utilities/src/time/timing'
import { PollingInterval } from 'wallet/src/constants/misc'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useRestQuery } from 'wallet/src/data/rest'
import {
  QuoteRequest as TradingApiQuoteRequest,
  QuoteResponse as TradingApiQuoteResponse,
  RoutingPreference,
  TradeType as TradingApiTradeType,
} from 'wallet/src/data/tradingApi/__generated__/api'
import { TradingApiApolloClient } from 'wallet/src/features/transactions/swap/tradingApi/client'
import {
  getTokenAddressForApiRequest,
  toTradingApiSupportedChainId,
  transformTradingApiResponseToTrade,
} from 'wallet/src/features/transactions/swap/tradingApi/utils'
import { TradeWithStatus, UseTradeArgs } from 'wallet/src/features/transactions/swap/useTrade'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { areCurrencyIdsEqual, currencyId } from 'wallet/src/utils/currencyId'

// error strings hardcoded in @uniswap/unified-routing-api
// https://github.com/Uniswap/unified-routing-api/blob/020ea371a00d4cc25ce9f9906479b00a43c65f2c/lib/util/errors.ts#L4
export const SWAP_QUOTE_ERROR = 'QUOTE_ERROR'

// client side error code for when the api returns an empty response
export const NO_QUOTE_DATA = 'NO_QUOTE_DATA'

const DEFAULT_DEADLINE_S = 60 * 30 // 30 minutes in seconds

export function useTradingApiTrade(args: UseTradeArgs): TradeWithStatus {
  const {
    amountSpecified,
    otherCurrency,
    tradeType,
    pollingInterval,
    customSlippageTolerance,
    isUSDQuote,
    skip,
  } = args
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  /***** Format request arguments ******/

  const [debouncedAmountSpecified, isDebouncing] = useDebounceWithStatus(amountSpecified)
  const shouldDebounce =
    amountSpecified && debouncedAmountSpecified?.currency.chainId === otherCurrency?.chainId
  const amount = shouldDebounce ? debouncedAmountSpecified : amountSpecified

  const currencyIn = tradeType === TradeType.EXACT_INPUT ? amount?.currency : otherCurrency
  const currencyOut = tradeType === TradeType.EXACT_OUTPUT ? amount?.currency : otherCurrency
  const currencyInEqualsCurrencyOut =
    currencyIn &&
    currencyOut &&
    areCurrencyIdsEqual(currencyId(currencyIn), currencyId(currencyOut))

  const tokenInChainId = toTradingApiSupportedChainId(currencyIn?.chainId)
  const tokenOutChainId = toTradingApiSupportedChainId(currencyOut?.chainId)
  const tokenInAddress = getTokenAddressForApiRequest(currencyIn)
  const tokenOutAddress = getTokenAddressForApiRequest(currencyOut)

  const requestTradeType =
    tradeType === TradeType.EXACT_INPUT ? TradingApiTradeType.Input : TradingApiTradeType.Output

  const skipQuery =
    skip ||
    !tokenInAddress ||
    !tokenOutAddress ||
    !tokenInChainId ||
    !tokenOutChainId ||
    !amount ||
    currencyInEqualsCurrencyOut

  const quoteRequestArgs: TradingApiQuoteRequest | undefined = useMemo(() => {
    if (skipQuery) {
      return undefined
    }
    return {
      type: requestTradeType,
      amount: amount.quotient.toString(),
      swapper: activeAccountAddress,
      tokenInChainId,
      tokenOutChainId,
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      slippageTolerance: customSlippageTolerance,
      includeGasInfo: true,
      routingPreference: RoutingPreference.Classic,
    }
  }, [
    activeAccountAddress,
    amount,
    customSlippageTolerance,
    requestTradeType,
    skipQuery,
    tokenInAddress,
    tokenInChainId,
    tokenOutAddress,
    tokenOutChainId,
  ])

  /***** Fetch quote from trading API  ******/

  const response = useRestQuery<
    TradingApiQuoteResponse,
    TradingApiQuoteRequest | Record<string, never>
  >(
    uniswapUrls.tradingApiPaths.quote,
    quoteRequestArgs ?? {},
    ['quote', 'permitData'],
    {
      pollInterval: pollingInterval ?? PollingInterval.Fast,
      ttlMs: ONE_MINUTE_MS,
      skip: !quoteRequestArgs,
      notifyOnNetworkStatusChange: true,
    },
    'POST',
    TradingApiApolloClient
  )

  const { error, data, loading, networkStatus } = response

  /***** Format `trade` type, add errors if needed.  ******/

  return useMemo(() => {
    // Error logging
    if (error && !isUSDQuote) {
      logger.error(error, { tags: { file: 'useTradingApiTrade', function: 'quote' } })
    }
    if (data && !data.quote) {
      logger.error(new Error('Unexpected empty Trading API response'), {
        tags: { file: 'useTradingApiTrade', function: 'quote' },
        extra: {
          quoteRequestArgs,
        },
      })
    }

    if (!data?.quote) {
      // MOB(1193): Better handle Apollo 404s
      // https://github.com/apollographql/apollo-link-rest/pull/142/files#diff-018e2012bf1dae58fa1e87509b038abf51ace54994e63239343d717fb9a2d037R995
      // apollo-link-rest swallows 404 response errors, and instead just returns null data
      // Until we can parse response errors correctly, just manually create error.
      if (data === null && !error) {
        return {
          ...response,
          trade: null,
          error: new ApolloError({
            errorMessage: NO_QUOTE_DATA,
          }),
        }
      }

      return { ...response, trade: null }
    }

    const trade = transformTradingApiResponseToTrade({
      tokenInIsNative: Boolean(currencyIn?.isNative),
      tokenOutIsNative: Boolean(currencyOut?.isNative),
      tradeType,
      deadline: DEFAULT_DEADLINE_S,
      slippageTolerance: customSlippageTolerance,
      data,
    })

    // If `transformTradingApiResponseToTrade` returns a `null` trade, it means we have a non-null quote, but no routes.
    // Manually match the api quote error.
    if (trade === null) {
      return {
        ...response,
        trade: null,
        error: new ApolloError({
          errorMessage: SWAP_QUOTE_ERROR,
        }),
      }
    }

    return {
      loading: (amountSpecified && isDebouncing) || loading,
      error,
      trade,
      isFetching: networkStatus === NetworkStatus.poll,
    }
  }, [
    amountSpecified,
    currencyIn,
    currencyOut,
    customSlippageTolerance,
    data,
    error,
    isDebouncing,
    isUSDQuote,
    loading,
    networkStatus,
    quoteRequestArgs,
    response,
    tradeType,
  ])
}
