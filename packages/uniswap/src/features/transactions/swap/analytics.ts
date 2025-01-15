import { SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useEffect } from 'react'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances'
import { LocalizationContextState, useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapRouting, SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { TransactionSettingsContextState } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import { getSwapFeeUsd } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { TransactionOriginType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getCurrencyAddressForAnalytics } from 'uniswap/src/utils/currencyId'
import { percentFromFloat } from 'utilities/src/format/percent'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { ITraceContext, useTrace } from 'utilities/src/telemetry/trace/TraceContext'

// hook-based analytics because this one is data-lifecycle dependent
export function useSwapAnalytics(derivedSwapInfo: DerivedSwapInfo): void {
  const formatter = useLocalizationContext()
  const trace = useTrace()
  const {
    trade: { trade },
  } = derivedSwapInfo

  const quoteId = trade?.quote?.requestId

  const account = useAccountMeta()

  const { data: portfolioData } = usePortfolioTotalValue({
    address: account?.address,
    fetchPolicy: 'cache-first',
  })

  useEffect(() => {
    if (!trade) {
      return
    }

    sendAnalyticsEvent(
      SwapEventName.SWAP_QUOTE_RECEIVED,
      getBaseTradeAnalyticsProperties({
        formatter,
        trade,
        currencyInAmountUSD: derivedSwapInfo.currencyAmountsUSDValue.input,
        currencyOutAmountUSD: derivedSwapInfo.currencyAmountsUSDValue.output,
        portfolioBalanceUsd: portfolioData?.balanceUSD,
        trace,
      }),
    )
    // We only want to re-run this when we get a new `quoteId`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId])

  return
}

export function getBaseTradeAnalyticsProperties({
  formatter,
  trade,
  currencyInAmountUSD,
  currencyOutAmountUSD,
  portfolioBalanceUsd,
  trace,
}: {
  formatter: LocalizationContextState
  trade: Trade<Currency, Currency, TradeType>
  currencyInAmountUSD?: Maybe<CurrencyAmount<Currency>>
  currencyOutAmountUSD?: Maybe<CurrencyAmount<Currency>>
  portfolioBalanceUsd?: number
  trace: ITraceContext
}): SwapTradeBaseProperties {
  const portionAmount = getClassicQuoteFromResponse(trade?.quote)?.portionAmount

  const feeCurrencyAmount = getCurrencyAmount({
    value: portionAmount,
    valueType: ValueType.Raw,
    currency: trade.outputAmount.currency,
  })

  const classicQuote = getClassicQuoteFromResponse(trade?.quote)

  const finalOutputAmount = feeCurrencyAmount ? trade.outputAmount.subtract(feeCurrencyAmount) : trade.outputAmount

  const slippagePercent = percentFromFloat(trade.slippageTolerance ?? 0)

  return {
    ...trace,
    routing: tradeRoutingToFillType(trade),
    total_balances_usd: portfolioBalanceUsd,
    token_in_symbol: trade.inputAmount.currency.symbol,
    token_out_symbol: trade.outputAmount.currency.symbol,
    token_in_address: getCurrencyAddressForAnalytics(trade.inputAmount.currency),
    token_out_address: getCurrencyAddressForAnalytics(trade.outputAmount.currency),
    price_impact_basis_points: trade.priceImpact?.multiply(100).toSignificant(),
    chain_id:
      trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
        ? trade.inputAmount.currency.chainId
        : undefined,
    chain_id_in: trade.inputAmount.currency.chainId,
    chain_id_out: trade.outputAmount.currency.chainId,
    token_in_amount: trade.inputAmount.toExact(),
    token_out_amount: formatter.formatCurrencyAmount({
      value: finalOutputAmount,
      type: NumberType.SwapTradeAmount,
    }),
    token_in_amount_usd: currencyInAmountUSD ? parseFloat(currencyInAmountUSD.toFixed(2)) : undefined,
    token_out_amount_usd: currencyOutAmountUSD ? parseFloat(currencyOutAmountUSD.toFixed(2)) : undefined,
    allowed_slippage:
      trade.slippageTolerance !== undefined ? parseFloat(trade.slippageTolerance.toFixed(2)) : undefined,
    allowed_slippage_basis_points: trade.slippageTolerance ? trade.slippageTolerance * 100 : undefined,
    fee_amount: portionAmount,
    requestId: trade.quote?.requestId,
    ura_request_id: trade.quote?.requestId,
    ura_block_number: isClassic(trade) ? trade.quote?.quote.blockNumber : undefined,
    quoteId: classicQuote?.quoteId,
    transactionOriginType: TransactionOriginType.Internal,
    swap_quote_block_number: classicQuote?.blockNumber,
    estimated_network_fee_usd: isClassic(trade) ? trade.quote?.quote.gasFeeUSD : undefined,
    fee_usd: currencyOutAmountUSD
      ? getSwapFeeUsd({
          trade,
          outputAmount: trade.outputAmount,
          outputAmountUsd: currencyOutAmountUSD,
        })
      : undefined,
    type: trade.tradeType,
    minimum_output_after_slippage: trade.minimumAmountOut(slippagePercent).toSignificant(6),
    token_in_amount_max: trade.maximumAmountIn(slippagePercent).toExact(),
    token_out_amount_min: trade.minimumAmountOut(slippagePercent).toExact(),
    token_in_detected_tax: parseFloat(trade.inputTax.toFixed(2)),
    token_out_detected_tax: parseFloat(trade.outputTax.toFixed(2)),
    simulation_failure_reasons: isClassic(trade) ? trade.quote?.quote.txFailureReasons : undefined,
  }
}

export function getBaseTradeAnalyticsPropertiesFromSwapInfo({
  transactionSettings,
  derivedSwapInfo,
  formatter,
  trace,
}: {
  transactionSettings: TransactionSettingsContextState
  derivedSwapInfo: DerivedSwapInfo
  formatter: LocalizationContextState
  trace: ITraceContext
}): SwapTradeBaseProperties {
  const { chainId, currencyAmounts, currencyAmountsUSDValue } = derivedSwapInfo
  const inputCurrencyAmount = currencyAmounts[CurrencyField.INPUT]
  const outputCurrencyAmount = currencyAmounts[CurrencyField.OUTPUT]

  const currencyInAmountUSD = currencyAmountsUSDValue[CurrencyField.INPUT]
    ? parseFloat(currencyAmountsUSDValue[CurrencyField.INPUT].toFixed(2))
    : undefined
  const currencyOutAmountUSD = currencyAmountsUSDValue[CurrencyField.OUTPUT]
    ? parseFloat(currencyAmountsUSDValue[CurrencyField.OUTPUT].toFixed(2))
    : undefined

  const slippageTolerance = transactionSettings.customSlippageTolerance ?? transactionSettings.autoSlippageTolerance

  const portionAmount = getClassicQuoteFromResponse(derivedSwapInfo.trade?.trade?.quote)?.portionAmount

  const feeCurrencyAmount = getCurrencyAmount({
    value: portionAmount,
    valueType: ValueType.Raw,
    currency: outputCurrencyAmount?.currency,
  })

  const finalOutputAmount =
    outputCurrencyAmount && feeCurrencyAmount ? outputCurrencyAmount.subtract(feeCurrencyAmount) : outputCurrencyAmount

  return {
    ...trace,
    token_in_symbol: inputCurrencyAmount?.currency.symbol,
    token_out_symbol: outputCurrencyAmount?.currency.symbol,
    token_in_address: inputCurrencyAmount ? getCurrencyAddressForAnalytics(inputCurrencyAmount?.currency) : '',
    token_out_address: outputCurrencyAmount ? getCurrencyAddressForAnalytics(outputCurrencyAmount?.currency) : '',
    price_impact_basis_points: derivedSwapInfo.trade.trade?.priceImpact?.multiply(100)?.toSignificant(),
    estimated_network_fee_usd: undefined,
    chain_id: chainId,
    token_in_amount: inputCurrencyAmount?.toExact() ?? '',
    token_out_amount: formatter.formatCurrencyAmount({
      value: finalOutputAmount,
      type: NumberType.SwapTradeAmount,
    }),
    token_in_amount_usd: currencyInAmountUSD,
    token_out_amount_usd: currencyOutAmountUSD,
    allowed_slippage_basis_points: slippageTolerance ? slippageTolerance * 100 : undefined,
    fee_amount: portionAmount,
    transactionOriginType: TransactionOriginType.Internal,
  }
}

export function logSwapQuoteFetch({
  chainId,
  isUSDQuote = false,
  isQuickRoute = false,
}: {
  chainId: number
  isUSDQuote?: boolean
  isQuickRoute?: boolean
}): void {
  let performanceMetrics = {}
  if (!isUSDQuote) {
    const hasSetSwapQuote = timestampTracker.hasTimestamp(SwapEventType.FirstQuoteFetchStarted)
    const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstQuoteFetchStarted)

    // We only log the time_to_first_quote_request metric for the first quote request of a session.
    const time_to_first_quote_request = hasSetSwapQuote ? undefined : elapsedTime
    const time_to_first_quote_request_since_first_input = hasSetSwapQuote
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstQuoteFetchStarted, SwapEventType.FirstSwapAction)

    performanceMetrics = { time_to_first_quote_request, time_to_first_quote_request_since_first_input }
  }
  sendAnalyticsEvent(SwapEventName.SWAP_QUOTE_FETCH, { chainId, isQuickRoute, ...performanceMetrics })
  logger.info('analytics', 'logSwapQuoteFetch', SwapEventName.SWAP_QUOTE_FETCH, {
    chainId,
    isQuickRoute,
    ...performanceMetrics,
  })
}

// eslint-disable-next-line consistent-return
export function tradeRoutingToFillType({
  routing,
  indicative,
}: {
  routing: Routing
  indicative: boolean
}): SwapRouting {
  if (indicative) {
    return 'none'
  }

  switch (routing) {
    case Routing.DUTCH_V2:
      return 'uniswap_x_v2'
    case Routing.DUTCH_LIMIT:
      return 'uniswap_x'
    case Routing.PRIORITY:
      return 'priority_order'
    case Routing.LIMIT_ORDER:
      return 'limit_order'
    case Routing.CLASSIC:
      return 'classic'
    case Routing.BRIDGE:
      return 'bridge'
  }
}
