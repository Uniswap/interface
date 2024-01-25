import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useDebounceWithStatus } from 'utilities/src/time/timing'
import { PollingInterval } from 'wallet/src/constants/misc'
import { GqlResult } from 'wallet/src/features/dataApi/types'
import { SimulatedGasEstimationInfo } from 'wallet/src/features/gas/types'
import { RoutingIntent, TradeQuoteRequest, useQuoteQuery } from 'wallet/src/features/routing/api'
import { TradeQuoteResult } from 'wallet/src/features/routing/types'
import { PermitSignatureInfo } from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { UseTradeArgs } from 'wallet/src/features/transactions/swap/useTrade'
import { QuoteType } from 'wallet/src/features/transactions/utils'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import {
  areCurrencyIdsEqual,
  currencyAddressForSwapQuote,
  currencyId,
} from 'wallet/src/utils/currencyId'

interface UseQuoteProps extends UseTradeArgs {
  skip?: boolean
  fetchSimulatedGasLimit?: boolean
  permitSignatureInfo?: PermitSignatureInfo | null
}

// Fetches quote from Routing API
export function useRouterQuote(params: UseQuoteProps): GqlResult<TradeQuoteResult> {
  const recipient = useActiveAccount()

  const {
    amountSpecified,
    tradeType,
    otherCurrency,
    pollingInterval = PollingInterval.Fast,
    skip,
    fetchSimulatedGasLimit,
    permitSignatureInfo,
    customSlippageTolerance,
    isUSDQuote,
    sendPortionEnabled,
  } = params

  const currencyIn = tradeType === TradeType.EXACT_INPUT ? amountSpecified?.currency : otherCurrency
  const currencyOut =
    tradeType === TradeType.EXACT_OUTPUT ? amountSpecified?.currency : otherCurrency

  const tokenInAddress = currencyIn ? currencyAddressForSwapQuote(currencyIn) : undefined
  const tokenInChainId = currencyIn?.chainId
  const tokenOutAddress = currencyOut ? currencyAddressForSwapQuote(currencyOut) : undefined
  const tokenOutChainId = currencyOut?.chainId

  const currencyInEqualsCurrencyOut =
    currencyIn &&
    currencyOut &&
    areCurrencyIdsEqual(currencyId(currencyIn), currencyId(currencyOut))

  const skipQuery =
    skip ||
    !amountSpecified ||
    !tokenInAddress ||
    !tokenOutAddress ||
    !tokenInChainId ||
    !tokenOutChainId ||
    currencyInEqualsCurrencyOut

  const request: TradeQuoteRequest | undefined = useMemo(() => {
    if (skipQuery) {
      return undefined
    }

    return {
      enableUniversalRouter: true,
      tokenInAddress,
      tokenInChainId,
      tokenOutAddress,
      tokenOutChainId,
      amount: amountSpecified.quotient.toString(),
      type: tradeType === TradeType.EXACT_INPUT ? 'exactIn' : 'exactOut',
      recipient: recipient?.address,
      fetchSimulatedGasLimit,
      permitSignatureInfo,
      slippageTolerance: customSlippageTolerance,
      loggingProperties: {
        isUSDQuote,
      },
      sendPortionEnabled,
      intent: isUSDQuote ? RoutingIntent.Pricing : RoutingIntent.Quote,
    }
  }, [
    amountSpecified?.quotient,
    customSlippageTolerance,
    fetchSimulatedGasLimit,
    isUSDQuote,
    permitSignatureInfo,
    recipient?.address,
    skipQuery,
    tokenInAddress,
    tokenInChainId,
    tokenOutAddress,
    tokenOutChainId,
    tradeType,
    sendPortionEnabled,
  ])

  const result = useQuoteQuery(request, {
    pollInterval: pollingInterval,
  })

  return result
}

export function useSimulatedGasLimit(
  amountSpecified: Maybe<CurrencyAmount<Currency>>,
  otherCurrency: Maybe<Currency>,
  tradeType: TradeType,
  skip: boolean,
  permitSignatureInfo: Maybe<PermitSignatureInfo>,
  customSlippageTolerance?: number
): SimulatedGasEstimationInfo {
  const [debouncedAmountSpecified, isDebouncing] = useDebounceWithStatus(amountSpecified)

  const { loading, error, data } = useRouterQuote({
    amountSpecified: debouncedAmountSpecified,
    otherCurrency,
    tradeType,
    skip,
    fetchSimulatedGasLimit: true,
    permitSignatureInfo,
    customSlippageTolerance,
  })

  // Enforce routing api quote type
  const quote =
    data?.trade.quoteData?.quoteType === QuoteType.RoutingApi
      ? data?.trade.quoteData.quote
      : undefined

  return useMemo(
    () => ({
      loading: loading || isDebouncing,
      error: error || data?.simulationError,
      quoteId: quote?.quoteId,
      requestId: quote?.requestId,
      simulatedGasLimit: data?.gasUseEstimate,
    }),
    [
      loading,
      isDebouncing,
      error,
      data?.simulationError,
      data?.gasUseEstimate,
      quote?.quoteId,
      quote?.requestId,
    ]
  )
}
