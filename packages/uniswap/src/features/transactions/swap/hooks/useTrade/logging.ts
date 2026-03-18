import { TradeType } from '@uniswap/sdk-core'
import { FetchError } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants/features'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { TradeService } from 'uniswap/src/features/transactions/swap/services/tradeService/tradeService'
import { BlockingTradeError } from 'uniswap/src/features/transactions/swap/types/BlockingTradeError'
import { Trade, UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { TransactionOriginType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getCurrencyAddressForAnalytics } from 'uniswap/src/utils/currencyId'
import { tryCatch } from 'utilities/src/errors'
import { getLogger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ITraceContext, useTrace } from 'utilities/src/telemetry/trace/TraceContext'

function getSwapQuoteFailedAnalyticsProperties(params: {
  error: Error
  trade?: Trade
  trace: ITraceContext
  args: UseTradeArgs
}): UniverseEventProperties[SwapEventName.SwapQuoteFailed] | undefined {
  const { error, trace, args } = params

  const isExactIn = args.tradeType === TradeType.EXACT_INPUT

  const inputCurrencyAmount = isExactIn ? args.amountSpecified : undefined
  const outputCurrencyAmount = !isExactIn ? args.amountSpecified : undefined
  const inputCurrency = isExactIn ? inputCurrencyAmount?.currency : args.otherCurrency
  const outputCurrency = !isExactIn ? outputCurrencyAmount?.currency : args.otherCurrency

  const slippageTolerance = args.customSlippageTolerance

  // This condition should never be hit after quoting; return statement satisfies the type checker
  if (!inputCurrency || !outputCurrency) {
    return undefined
  }

  return {
    // Error fields
    error_message: error.message,

    // Quote request metadata
    token_in_symbol: inputCurrency.symbol,
    token_out_symbol: outputCurrency.symbol,
    token_in_address: getCurrencyAddressForAnalytics(inputCurrency),
    token_out_address: getCurrencyAddressForAnalytics(outputCurrency),
    chain_id: inputCurrency.chainId,
    chain_id_in: inputCurrency.chainId,
    chain_id_out: outputCurrency.chainId,
    token_in_amount: inputCurrencyAmount?.toExact(),
    token_in_detected_tax: inputCurrency.wrapped.sellFeeBps?.toNumber(),
    token_out_amount: outputCurrencyAmount?.toExact(),
    token_out_detected_tax: outputCurrency.wrapped.buyFeeBps?.toNumber(),
    allowed_slippage: slippageTolerance,
    allowed_slippage_basis_points: slippageTolerance ? slippageTolerance * 100 : undefined,
    transactionOriginType: TransactionOriginType.Internal,
    ...trace,
  }
}

function useSendSwapQuoteFailureAnalyticsEvent(): (params: {
  error: Error
  trade?: Trade
  args: UseTradeArgs
}) => void {
  const trace = useTrace()

  return useEvent((params: { error: Error; trade?: Trade; args: UseTradeArgs }) => {
    const eventProperties = getSwapQuoteFailedAnalyticsProperties({ ...params, trace })

    if (!eventProperties) {
      return
    }

    sendAnalyticsEvent(SwapEventName.SwapQuoteFailed, eventProperties)
  })
}

function logSwapQuoteFailure(params: { error: Error; input: UseTradeArgs }): void {
  const { error, input } = params

  // Currently we only want to log Solana quote failures
  if (input.amountSpecified?.currency.chainId !== UniverseChainId.Solana) {
    return
  }

  // Avoid logging fetch errors, as they are common / monitored by our APIs
  if (error instanceof FetchError) {
    return
  }

  // Avoid logging USD quotes, as they do not block the swap flow
  if (input.isUSDQuote) {
    return
  }

  getLogger().error(error, {
    tags: {
      file: 'packages/uniswap/src/features/transactions/swap/hooks/useTrade/logging.ts',
      function: 'logSwapQuoteFailure',
    },
    extra: { ...input },
  })
}

function logBlockingTradeError(params: { blockingError: BlockingTradeError }): void {
  getLogger().error(params.blockingError, {
    tags: {
      file: 'packages/uniswap/src/features/transactions/swap/hooks/useTrade/logging.ts',
      function: 'logBlockingTradeError',
    },
    extra: { ...params.blockingError },
  })
}

export function useWithQuoteLogging(): (service: TradeService) => TradeService {
  const sendSwapQuoteFailureAnalyticsEvent = useSendSwapQuoteFailureAnalyticsEvent()

  return useEvent((service: TradeService) => {
    const wrappedService: TradeService = {
      ...service,
      async getTrade(args) {
        const { data: trade, error: serviceError } = await tryCatch(service.getTrade(args))

        if (trade?.trade?.blockingError) {
          logBlockingTradeError({ blockingError: trade.trade.blockingError })
        }

        if (serviceError) {
          sendSwapQuoteFailureAnalyticsEvent({ error: serviceError, args })
          logSwapQuoteFailure({ error: serviceError, input: args })
          throw serviceError
        }

        return trade
      },
    }

    return wrappedService
  })
}
