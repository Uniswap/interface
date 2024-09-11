import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { FetchError } from 'uniswap/src/data/apiClients/FetchError'
import { useTradingApiQuoteQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiQuoteQuery'
import { QuoteRequest, TradeType as TradingApiTradeType } from 'uniswap/src/data/tradingApi/__generated__/index'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useIndicativeTrade } from 'uniswap/src/features/transactions/swap/hooks/useIndicativeTrade'
import { usePollingIntervalByChain } from 'uniswap/src/features/transactions/swap/hooks/usePollingIntervalByChain'
import { TradeWithStatus, UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  getRoutingPreferenceForSwapRequest,
  getTokenAddressForApi,
  toTradingApiSupportedChainId,
  transformTradingApiResponseToTrade,
  validateTrade,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'
import { ONE_SECOND_MS, inXMinutesUnix } from 'utilities/src/time/time'
import { useDebounceWithStatus } from 'utilities/src/time/timing'

// error strings hardcoded in @uniswap/unified-routing-api
// https://github.com/Uniswap/unified-routing-api/blob/020ea371a00d4cc25ce9f9906479b00a43c65f2c/lib/util/errors.ts#L4
export const SWAP_QUOTE_ERROR = 'QUOTE_ERROR'

export const API_RATE_LIMIT_ERROR = 'TOO_MANY_REQUESTS'

// The TradingAPI requires an address for the swapper field; we supply a placeholder address if no account is connected.
// Note: This address was randomly generated.
const UNCONNECTED_ADDRESS = '0xAAAA44272dc658575Ba38f43C438447dDED45358'

const DEFAULT_SWAP_VALIDITY_TIME_MINS = 30

const SWAP_FORM_DEBOUNCE_TIME_MS = 250

export class NoRoutesError extends Error {
  constructor(message: string = 'No routes found') {
    super(message)
    this.name = 'NoRoutesError'
  }
}

export function useTrade(args: UseTradeArgs): TradeWithStatus {
  const {
    account,
    amountSpecified,
    otherCurrency,
    tradeType,
    pollInterval,
    customSlippageTolerance,
    isUSDQuote,
    skip,
    tradeProtocolPreference,
  } = args
  const activeAccountAddress = account?.address

  const uniswapXEnabled = useFeatureFlag(FeatureFlags.UniswapX)

  /***** Format request arguments ******/

  const [debouncedAmountSpecified, isDebouncing] = useDebounceWithStatus(amountSpecified, SWAP_FORM_DEBOUNCE_TIME_MS)
  const shouldDebounce = amountSpecified && debouncedAmountSpecified?.currency.chainId === otherCurrency?.chainId
  const amount = shouldDebounce ? debouncedAmountSpecified : amountSpecified

  const currencyIn = tradeType === TradeType.EXACT_INPUT ? amount?.currency : otherCurrency
  const currencyOut = tradeType === TradeType.EXACT_OUTPUT ? amount?.currency : otherCurrency
  const currencyInEqualsCurrencyOut =
    currencyIn && currencyOut && areCurrencyIdsEqual(currencyId(currencyIn), currencyId(currencyOut))

  const tokenInChainId = toTradingApiSupportedChainId(currencyIn?.chainId)
  const tokenOutChainId = toTradingApiSupportedChainId(currencyOut?.chainId)
  const tokenInAddress = getTokenAddressForApi(currencyIn)
  const tokenOutAddress = getTokenAddressForApi(currencyOut)

  const routingPreference = getRoutingPreferenceForSwapRequest(tradeProtocolPreference, uniswapXEnabled, isUSDQuote)

  const requestTradeType =
    tradeType === TradeType.EXACT_INPUT ? TradingApiTradeType.EXACT_INPUT : TradingApiTradeType.EXACT_OUTPUT

  const skipQuery =
    skip ||
    !tokenInAddress ||
    !tokenOutAddress ||
    !tokenInChainId ||
    !tokenOutChainId ||
    !amount ||
    currencyInEqualsCurrencyOut

  const quoteRequestArgs: QuoteRequest | undefined = useMemo(() => {
    if (skipQuery) {
      return undefined
    }

    const quoteArgs: QuoteRequest = {
      type: requestTradeType,
      amount: amount.quotient.toString(),
      swapper: activeAccountAddress ?? UNCONNECTED_ADDRESS,
      tokenInChainId,
      tokenOutChainId,
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      slippageTolerance: customSlippageTolerance,
      routingPreference,
    }

    return quoteArgs
  }, [
    activeAccountAddress,
    amount,
    customSlippageTolerance,
    requestTradeType,
    routingPreference,
    skipQuery,
    tokenInAddress,
    tokenInChainId,
    tokenOutAddress,
    tokenOutChainId,
  ])

  /***** Fetch quote from trading API  ******/

  const pollingIntervalForChain = usePollingIntervalByChain(currencyIn?.chainId)
  const internalPollInterval = pollInterval ?? pollingIntervalForChain

  const response = useTradingApiQuoteQuery({
    params: quoteRequestArgs,
    refetchInterval: internalPollInterval,
    staleTime: internalPollInterval,
    // We set the `gcTime` to 15 seconds longer than the refetch interval so that there's more than enough time for a refetch to complete before we clear the stale data.
    // If the user loses internet connection (or leaves the app and comes back) for longer than this,
    // then we clear stale data and show a big loading spinner in the swap review screen.
    immediateGcTime: internalPollInterval + ONE_SECOND_MS * 15,
  })

  const { error, data, isLoading: queryIsLoading, isFetching } = response

  const isLoading = (amountSpecified && isDebouncing) || queryIsLoading

  const indicativeQuotesEnabled = useFeatureFlag(FeatureFlags.IndicativeSwapQuotes)
  const indicative = useIndicativeTrade({
    quoteRequestArgs,
    currencyIn,
    currencyOut,
    customSlippageTolerance,
    skip: !indicativeQuotesEnabled || isUSDQuote,
  })

  /***** Format `trade` type, add errors if needed.  ******/

  return useMemo(() => {
    // Error logging
    // We use DataDog to catch network errors on Mobile
    if (error && (!isMobileApp || !(error instanceof FetchError)) && !isUSDQuote) {
      logger.error(error, { tags: { file: 'useTrade', function: 'quote' } })
    }

    if (data && !data.quote) {
      logger.error(new Error('Unexpected empty Trading API response'), {
        tags: { file: 'useTrade', function: 'quote' },
        extra: {
          quoteRequestArgs,
        },
      })
    }

    if (!data?.quote || !currencyIn || !currencyOut) {
      return {
        isLoading,
        isFetching,
        trade: null,
        indicativeTrade: isLoading ? indicative.trade : undefined,
        isIndicativeLoading: (amountSpecified && isDebouncing) || indicative.isLoading,
        error,
      }
    }

    const formattedTrade = transformTradingApiResponseToTrade({
      currencyIn,
      currencyOut,
      tradeType,
      deadline: inXMinutesUnix(DEFAULT_SWAP_VALIDITY_TIME_MINS), // TODO(MOB-3050): set deadline as `quoteRequestArgs.deadline`
      slippageTolerance: customSlippageTolerance,
      data,
    })

    const exactCurrencyField = tradeType === TradeType.EXACT_INPUT ? CurrencyField.INPUT : CurrencyField.OUTPUT

    const trade = validateTrade({
      trade: formattedTrade,
      currencyIn,
      currencyOut,
      exactAmount: amount,
      exactCurrencyField,
    })

    // If `transformTradingApiResponseToTrade` returns a `null` trade, it means we have a non-null quote, but no routes.
    if (trade === null) {
      return {
        isLoading,
        isFetching,
        trade: null,
        indicativeTrade: undefined, // We don't want to show the indicative trade if there is no completable trade
        isIndicativeLoading: false,
        error: new NoRoutesError(),
      }
    }

    return {
      isLoading: (amountSpecified && isDebouncing) || isLoading,
      isFetching,
      trade,
      indicativeTrade: indicative.trade,
      isIndicativeLoading: (amountSpecified && isDebouncing) || indicative.isLoading,
      error,
    }
  }, [
    amount,
    amountSpecified,
    currencyIn,
    currencyOut,
    customSlippageTolerance,
    data,
    error,
    isDebouncing,
    isFetching,
    isLoading,
    isUSDQuote,
    indicative.trade,
    indicative.isLoading,
    quoteRequestArgs,
    tradeType,
  ])
}
