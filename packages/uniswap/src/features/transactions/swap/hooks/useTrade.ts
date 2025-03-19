import { TradeType } from '@uniswap/sdk-core'
import { useMemo, useRef } from 'react'
import { FetchError } from 'uniswap/src/data/apiClients/FetchError'
import { useTradingApiQuoteQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiQuoteQuery'
import { TradeType as TradingApiTradeType } from 'uniswap/src/data/tradingApi/__generated__/index'
import { useActiveGasStrategy, useShadowGasStrategies } from 'uniswap/src/features/gas/hooks'
import { areEqualGasStrategies } from 'uniswap/src/features/gas/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useIndicativeTrade } from 'uniswap/src/features/transactions/swap/hooks/useIndicativeTrade'
import { usePollingIntervalByChain } from 'uniswap/src/features/transactions/swap/hooks/usePollingIntervalByChain'
import { TradeWithStatus, UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/useV4SwapEnabled'
import {
  SWAP_GAS_URGENCY_OVERRIDE,
  getTokenAddressForApi,
  toTradingApiSupportedChainId,
  transformTradingApiResponseToTrade,
  useQuoteRoutingParams,
  useQuoteSlippageParams,
  validateTrade,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'
import { ONE_SECOND_MS, inXMinutesUnix } from 'utilities/src/time/time'

// error strings hardcoded in @uniswap/unified-routing-api
// https://github.com/Uniswap/unified-routing-api/blob/020ea371a00d4cc25ce9f9906479b00a43c65f2c/lib/util/errors.ts#L4
export const SWAP_QUOTE_ERROR = 'QUOTE_ERROR'

export const API_RATE_LIMIT_ERROR = 'TOO_MANY_REQUESTS'

// The TradingAPI requires an address for the swapper field; we supply a placeholder address if no account is connected.
// Note: This address was randomly generated.
const UNCONNECTED_ADDRESS = '0xAAAA44272dc658575Ba38f43C438447dDED45358'

const DEFAULT_SWAP_VALIDITY_TIME_MINS = 30

export function useTrade({
  account,
  amountSpecified: amount,
  otherCurrency,
  tradeType,
  pollInterval,
  customSlippageTolerance,
  isUSDQuote,
  skip,
  selectedProtocols,
  isDebouncing,
}: UseTradeArgs): TradeWithStatus {
  const activeAccountAddress = account?.address

  /***** Format request arguments ******/

  const currencyIn = tradeType === TradeType.EXACT_INPUT ? amount?.currency : otherCurrency
  const currencyOut = tradeType === TradeType.EXACT_OUTPUT ? amount?.currency : otherCurrency
  const currencyInEqualsCurrencyOut =
    currencyIn && currencyOut && areCurrencyIdsEqual(currencyId(currencyIn), currencyId(currencyOut))

  const tokenInChainId = toTradingApiSupportedChainId(currencyIn?.chainId)
  const v4SwapEnabled = useV4SwapEnabled(tokenInChainId)

  const tokenOutChainId = toTradingApiSupportedChainId(currencyOut?.chainId)
  const tokenInAddress = getTokenAddressForApi(currencyIn)
  const tokenOutAddress = getTokenAddressForApi(currencyOut)
  const activeGasStrategy = useActiveGasStrategy(tokenInChainId, 'swap')
  const shadowGasStrategies = useShadowGasStrategies(tokenInChainId, 'swap')

  const routingParams = useQuoteRoutingParams({
    selectedProtocols,
    tokenInChainId: currencyIn?.chainId,
    tokenOutChainId: currencyOut?.chainId,
    isUSDQuote,
  })
  const slippageParams = useQuoteSlippageParams({
    customSlippageTolerance,
    tokenInChainId: currencyIn?.chainId,
    tokenOutChainId: currencyOut?.chainId,
    isUSDQuote,
  })

  const requestTradeType =
    tradeType === TradeType.EXACT_INPUT ? TradingApiTradeType.EXACT_INPUT : TradingApiTradeType.EXACT_OUTPUT

  const isZeroAmount = amount?.quotient.toString() === '0'

  const skipQuery =
    skip ||
    !tokenInAddress ||
    !tokenOutAddress ||
    !tokenInChainId ||
    !tokenOutChainId ||
    !amount ||
    isZeroAmount ||
    currencyInEqualsCurrencyOut

  const quoteRequestArgs = useMemo((): Parameters<typeof useTradingApiQuoteQuery>[0]['params'] | undefined => {
    if (skipQuery) {
      return undefined
    }
    return {
      amount: amount.quotient.toString(),
      gasStrategies: [activeGasStrategy, ...(shadowGasStrategies ?? [])],
      isUSDQuote,
      swapper: activeAccountAddress ?? UNCONNECTED_ADDRESS,
      tokenIn: tokenInAddress,
      tokenInChainId,
      tokenOut: tokenOutAddress,
      tokenOutChainId,
      type: requestTradeType,
      urgency: SWAP_GAS_URGENCY_OVERRIDE,
      v4Enabled: v4SwapEnabled,
      ...routingParams,
      ...slippageParams,
    }
  }, [
    activeAccountAddress,
    activeGasStrategy,
    amount,
    isUSDQuote,
    requestTradeType,
    routingParams,
    shadowGasStrategies,
    skipQuery,
    slippageParams,
    tokenInAddress,
    tokenInChainId,
    tokenOutAddress,
    tokenOutChainId,
    v4SwapEnabled,
  ])

  /***** Fetch quote from trading API  ******/

  const pollingIntervalForChain = usePollingIntervalByChain(currencyIn?.chainId)
  const internalPollInterval = pollInterval ?? pollingIntervalForChain

  const response = useTradingApiQuoteQuery({
    params: quoteRequestArgs,
    refetchInterval: internalPollInterval,
    // We set the `gcTime` to 15 seconds longer than the refetch interval so that there's more than enough time for a refetch to complete before we clear the stale data.
    // If the user loses internet connection (or leaves the app and comes back) for longer than this,
    // then we clear stale data and show a big loading spinner in the swap review screen.
    immediateGcTime: internalPollInterval + ONE_SECOND_MS * 15,
    // We want to retry once, rather than the default, in order to populate response.error / Error UI sooner.
    // The query will still poll after failed retries, due to staleness.
    retry: 1,
  })

  const { error, data, isLoading: queryIsLoading, isFetching, errorUpdatedAt, dataUpdatedAt } = response

  const errorRef = useRef<Error | null>(error)

  // We want to keep the error while react-query is refetching, so that the error message doesn't go in and out while it's polling.
  if (errorUpdatedAt > dataUpdatedAt) {
    // If there's a new error, save the new one. If there's no error (we're re-fetching), keep the old one.
    errorRef.current = error ?? errorRef.current
  } else {
    errorRef.current = error
  }

  const isLoading = (amount && isDebouncing) || queryIsLoading

  const indicativeQuotesEnabled = useFeatureFlag(FeatureFlags.IndicativeSwapQuotes)
  const indicative = useIndicativeTrade({
    quoteRequestArgs,
    currencyIn,
    currencyOut,
    skip: !indicativeQuotesEnabled || isUSDQuote,
  })

  /***** Format `trade` type, add errors if needed.  ******/

  return useMemo(() => {
    // Error logging
    // We use DataDog to catch network errors on Mobile
    if (error && (!isMobileApp || !(error instanceof FetchError)) && !isUSDQuote) {
      logger.error(error, { tags: { file: 'useTrade', function: 'quote' }, extra: { ...quoteRequestArgs } })
    }

    if (data && !data.quote) {
      logger.error(new Error('Unexpected empty Trading API response'), {
        tags: { file: 'useTrade', function: 'quote' },
        extra: {
          quoteRequestArgs,
        },
      })
    }

    let gasEstimates: GasFeeEstimates | undefined
    if (data?.quote && 'gasEstimates' in data.quote && data.quote.gasEstimates) {
      // Only classic quotes include gasEstimates
      const activeGasEstimate = data.quote.gasEstimates.find((e) =>
        areEqualGasStrategies(e.strategy, activeGasStrategy),
      )
      gasEstimates = activeGasEstimate
        ? {
            activeEstimate: activeGasEstimate,
            shadowEstimates: data.quote.gasEstimates.filter((e) => e !== activeGasEstimate),
          }
        : undefined
    }

    if (!data?.quote || !currencyIn || !currencyOut) {
      return {
        isLoading,
        isFetching,
        trade: null,
        indicativeTrade: isLoading ? indicative.trade : undefined,
        isIndicativeLoading: indicative.isLoading,
        error: errorRef.current,
        gasEstimates,
      }
    }

    const formattedTrade = transformTradingApiResponseToTrade({
      currencyIn,
      currencyOut,
      tradeType,
      deadline: inXMinutesUnix(DEFAULT_SWAP_VALIDITY_TIME_MINS), // TODO(MOB-3050): set deadline as `quoteRequestArgs.deadline`
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
        error: new Error('Unable to validate trade'),
        gasEstimates,
      }
    }

    return {
      isLoading: isDebouncing || isLoading,
      isFetching,
      trade,
      indicativeTrade: indicative.trade,
      isIndicativeLoading: indicative.isLoading,
      error,
      gasEstimates,
    }
  }, [
    activeGasStrategy,
    amount,
    currencyIn,
    currencyOut,
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
