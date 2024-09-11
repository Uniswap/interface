import { SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useEffect } from 'react'
import { LocalizationContextState, useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { TransactionOriginType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getCurrencyAddressForAnalytics } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

// hook-based analytics because this one is data-lifecycle dependent
export function useSwapAnalytics(derivedSwapInfo: DerivedSwapInfo): void {
  const formatter = useLocalizationContext()
  const {
    trade: { trade },
  } = derivedSwapInfo

  const quoteId = trade?.quote?.requestId

  useEffect(() => {
    if (!trade) {
      return
    }

    sendAnalyticsEvent(SwapEventName.SWAP_QUOTE_RECEIVED, getBaseTradeAnalyticsProperties({ formatter, trade }))
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
}: {
  formatter: LocalizationContextState
  trade: Trade<Currency, Currency, TradeType>
  currencyInAmountUSD?: Maybe<CurrencyAmount<Currency>>
  currencyOutAmountUSD?: Maybe<CurrencyAmount<Currency>>
}): SwapTradeBaseProperties {
  const portionAmount = getClassicQuoteFromResponse(trade?.quote)?.portionAmount

  const feeCurrencyAmount = getCurrencyAmount({
    value: portionAmount,
    valueType: ValueType.Raw,
    currency: trade.outputAmount.currency,
  })

  const quoteId = getClassicQuoteFromResponse(trade?.quote)?.quoteId

  const finalOutputAmount = feeCurrencyAmount ? trade.outputAmount.subtract(feeCurrencyAmount) : trade.outputAmount

  return {
    token_in_symbol: trade.inputAmount.currency.symbol,
    token_out_symbol: trade.outputAmount.currency.symbol,
    token_in_address: getCurrencyAddressForAnalytics(trade.inputAmount.currency),
    token_out_address: getCurrencyAddressForAnalytics(trade.outputAmount.currency),
    price_impact_basis_points: trade.priceImpact.multiply(100).toSignificant(),
    // TODO: [MOB-237] add gas fee in USD here once we calculate USD value of `totalGasFee` on swap form instead of just on review
    estimated_network_fee_usd: undefined,
    chain_id: trade.inputAmount.currency.chainId,
    token_in_amount: trade.inputAmount.toExact(),
    token_out_amount: formatter.formatCurrencyAmount({
      value: finalOutputAmount,
      type: NumberType.SwapTradeAmount,
    }),
    token_in_amount_usd: currencyInAmountUSD ? parseFloat(currencyInAmountUSD.toFixed(2)) : undefined,
    token_out_amount_usd: currencyOutAmountUSD ? parseFloat(currencyOutAmountUSD.toFixed(2)) : undefined,
    allowed_slippage_basis_points: trade.slippageTolerance * 100,
    fee_amount: portionAmount,
    requestId: trade.quote?.requestId,
    quoteId,
    transactionOriginType: TransactionOriginType.Internal,
  }
}

export function getBaseTradeAnalyticsPropertiesFromSwapInfo({
  derivedSwapInfo,
  formatter,
}: {
  derivedSwapInfo: DerivedSwapInfo
  formatter: LocalizationContextState
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

  const slippageTolerance = derivedSwapInfo.customSlippageTolerance ?? derivedSwapInfo.autoSlippageTolerance

  const portionAmount = getClassicQuoteFromResponse(derivedSwapInfo.trade?.trade?.quote)?.portionAmount

  const feeCurrencyAmount = getCurrencyAmount({
    value: portionAmount,
    valueType: ValueType.Raw,
    currency: outputCurrencyAmount?.currency,
  })

  const finalOutputAmount =
    outputCurrencyAmount && feeCurrencyAmount ? outputCurrencyAmount.subtract(feeCurrencyAmount) : outputCurrencyAmount

  return {
    token_in_symbol: inputCurrencyAmount?.currency.symbol,
    token_out_symbol: outputCurrencyAmount?.currency.symbol,
    token_in_address: inputCurrencyAmount ? getCurrencyAddressForAnalytics(inputCurrencyAmount?.currency) : '',
    token_out_address: outputCurrencyAmount ? getCurrencyAddressForAnalytics(outputCurrencyAmount?.currency) : '',
    price_impact_basis_points: derivedSwapInfo.trade.trade?.priceImpact.multiply(100).toSignificant(),
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
