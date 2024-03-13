import { ApolloError, NetworkStatus } from '@apollo/client'
import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useRestQuery } from 'uniswap/src/data/rest'
import { logger } from 'utilities/src/logger/logger'
import { useDebounceWithStatus } from 'utilities/src/time/timing'
import { PollingInterval } from 'wallet/src/constants/misc'
import {
  RoutingPreference,
  QuoteRequest as TradingApiQuoteRequest,
  QuoteResponse as TradingApiQuoteResponse,
  TradeType as TradingApiTradeType,
} from 'wallet/src/data/tradingApi/__generated__/api'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { TradingApiApolloClient } from 'wallet/src/features/transactions/swap/trade/tradingApi/client'
import {
  getTokenAddressForApiRequest,
  toTradingApiSupportedChainId,
  transformTradingApiResponseToTrade,
  validateTrade,
} from 'wallet/src/features/transactions/swap/trade/tradingApi/utils'
import { TradeWithStatus, UseTradeArgs } from 'wallet/src/features/transactions/swap/trade/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { areCurrencyIdsEqual, currencyId } from 'wallet/src/utils/currencyId'

// error strings hardcoded in @uniswap/unified-routing-api
// https://github.com/Uniswap/unified-routing-api/blob/020ea371a00d4cc25ce9f9906479b00a43c65f2c/lib/util/errors.ts#L4
export const SWAP_QUOTE_ERROR = 'QUOTE_ERROR'

// client side error code for when the api returns an empty response
export const NO_QUOTE_DATA = 'NO_QUOTE_DATA'

const DEFAULT_DEADLINE_S = 60 * 30 // 30 minutes in seconds

export const SWAP_FORM_DEBOUNCE_TIME_MS = 250

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

  const formatter = useLocalizationContext()

  /***** Format request arguments ******/

  const [debouncedAmountSpecified, isDebouncing] = useDebounceWithStatus(
    amountSpecified,
    SWAP_FORM_DEBOUNCE_TIME_MS
  )
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
      skip: !quoteRequestArgs,
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'no-cache',
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

    const formattedTrade = transformTradingApiResponseToTrade({
      tokenInIsNative: Boolean(currencyIn?.isNative),
      tokenOutIsNative: Boolean(currencyOut?.isNative),
      tradeType,
      deadline: DEFAULT_DEADLINE_S,
      slippageTolerance: customSlippageTolerance,
      data,
    })

    const exactCurrencyField =
      tradeType === TradeType.EXACT_INPUT ? CurrencyField.INPUT : CurrencyField.OUTPUT

    const trade = validateTrade({
      trade: formattedTrade,
      currencyIn,
      currencyOut,
      exactAmount: amount,
      exactCurrencyField,
      formatter,
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
    amount,
    amountSpecified,
    currencyIn,
    currencyOut,
    customSlippageTolerance,
    data,
    error,
    formatter,
    isDebouncing,
    isUSDQuote,
    loading,
    networkStatus,
    quoteRequestArgs,
    response,
    tradeType,
  ])
}
