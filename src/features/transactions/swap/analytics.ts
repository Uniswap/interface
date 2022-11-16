import { useEffect, useRef } from 'react'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { EventName } from 'src/features/telemetry/constants'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { currencyAddress } from 'src/utils/currencyId'
import { formatCurrencyAmount, NumberType } from 'src/utils/format'

// hook-based analytics because this one is data-lifecycle dependent
export function useSwapAnalytics(derivedSwapInfo: DerivedSwapInfo): void {
  const {
    trade: { trade },
  } = derivedSwapInfo

  const tradeRef = useRef(trade)

  useEffect(() => {
    tradeRef.current = trade
  }, [trade])

  const inputAmount = tradeRef.current?.inputAmount.toExact()
  const inputCurrency = tradeRef.current?.inputAmount.currency
  const outputCurrency = tradeRef.current?.outputAmount.currency
  const tradeType = tradeRef.current?.tradeType

  // run useEffect based on ids since `Currency` objects themselves may be
  // different instances per render
  const inputCurrencyId = inputCurrency && currencyAddress(inputCurrency)
  const outputCurrencyId = outputCurrency && currencyAddress(outputCurrency)

  // a unique trade is defined by a combination of (input currencyAmount, output token, and trade type)
  // send analytics event only on unique trades and not on swap quote refreshes
  useEffect(() => {
    const currTrade = tradeRef.current
    if (!currTrade || !inputAmount) return

    sendAnalyticsEvent(EventName.SwapQuoteReceived, {
      token_in_symbol: currTrade.inputAmount.currency.symbol,
      token_out_symbol: currTrade.outputAmount.currency.symbol,
      token_in_address: currencyAddress(currTrade.inputAmount.currency),
      token_out_address: currencyAddress(currTrade.outputAmount.currency),
      price_impact_basis_points: currTrade.priceImpact.multiply(100).toSignificant(),
      // TODO: add gas fee in USD here once we calculate USD value of `totalGasFee` on swap form instead of just on review
      estimated_network_fee_usd: undefined,
      chain_id: currTrade.inputAmount.currency.chainId,
      token_in_amount: inputAmount,
      token_out_amount: formatCurrencyAmount(currTrade.outputAmount, NumberType.SwapTradeAmount),
    })
  }, [inputAmount, inputCurrencyId, outputCurrencyId, tradeType])

  return
}
