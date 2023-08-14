import { Currency, CurrencyAmount, Percent, Price, Token } from '@uniswap/sdk-core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { InterfaceTrade, QuoteMethod } from 'state/routing/types'
import { isClassicTrade, isUniswapXTrade } from 'state/routing/utils'
import { computeRealizedPriceImpact } from 'utils/prices'

export const getDurationUntilTimestampSeconds = (futureTimestampInSecondsSinceEpoch?: number): number | undefined => {
  if (!futureTimestampInSecondsSinceEpoch) return undefined
  return futureTimestampInSecondsSinceEpoch - new Date().getTime() / 1000
}

export const getDurationFromDateMilliseconds = (start?: Date): number | undefined => {
  if (!start) return undefined
  return new Date().getTime() - start.getTime()
}

export const formatToDecimal = (
  intialNumberObject: Percent | CurrencyAmount<Token | Currency>,
  decimalPlace: number
): number => parseFloat(intialNumberObject.toFixed(decimalPlace))

export const getTokenAddress = (currency: Currency) => (currency.isNative ? NATIVE_CHAIN_ID : currency.address)

export const formatPercentInBasisPointsNumber = (percent: Percent): number => parseFloat(percent.toFixed(2)) * 100

export const formatPercentNumber = (percent: Percent): number => parseFloat(percent.toFixed(2))

export const getPriceUpdateBasisPoints = (
  prevPrice: Price<Currency, Currency>,
  newPrice: Price<Currency, Currency>
): number => {
  const changeFraction = newPrice.subtract(prevPrice).divide(prevPrice)
  const changePercentage = new Percent(changeFraction.numerator, changeFraction.denominator)
  return formatPercentInBasisPointsNumber(changePercentage)
}

export function formatCommonPropertiesForTrade(trade: InterfaceTrade, allowedSlippage: Percent) {
  return {
    routing: trade.fillType,
    type: trade.tradeType,
    ura_quote_id: isUniswapXTrade(trade) ? trade.quoteId : undefined,
    ura_request_id: trade.requestId,
    token_in_address: getTokenAddress(trade.inputAmount.currency),
    token_out_address: getTokenAddress(trade.outputAmount.currency),
    token_in_symbol: trade.inputAmount.currency.symbol,
    token_out_symbol: trade.outputAmount.currency.symbol,
    token_in_amount: formatToDecimal(trade.inputAmount, trade.inputAmount.currency.decimals),
    token_out_amount: formatToDecimal(trade.outputAmount, trade.outputAmount.currency.decimals),
    price_impact_basis_points: isClassicTrade(trade)
      ? formatPercentInBasisPointsNumber(computeRealizedPriceImpact(trade))
      : undefined,
    chain_id:
      trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
        ? trade.inputAmount.currency.chainId
        : undefined,
    estimated_network_fee_usd: isClassicTrade(trade) ? trade.gasUseEstimateUSD : trade.classicGasUseEstimateUSD,
    minimum_output_after_slippage: trade.minimumAmountOut(allowedSlippage).toSignificant(6),
    allowed_slippage: formatPercentNumber(allowedSlippage),
    method: getQuoteMethod(trade),
  }
}

export const formatSwapSignedAnalyticsEventProperties = ({
  trade,
  allowedSlippage,
  fiatValues,
  txHash,
  timeToSignSinceRequestMs,
}: {
  trade: InterfaceTrade
  allowedSlippage: Percent
  fiatValues: { amountIn?: number; amountOut?: number }
  txHash?: string
  timeToSignSinceRequestMs?: number
}) => ({
  transaction_hash: txHash,
  token_in_amount_usd: fiatValues.amountIn,
  token_out_amount_usd: fiatValues.amountOut,
  // measures the amount of time the user took to sign the permit message or swap tx in their wallet
  time_to_sign_since_request_ms: timeToSignSinceRequestMs,
  ...formatCommonPropertiesForTrade(trade, allowedSlippage),
})

function getQuoteMethod(trade: InterfaceTrade) {
  if (isUniswapXTrade(trade)) return QuoteMethod.ROUTING_API

  return trade.quoteMethod
}

export const formatSwapQuoteReceivedEventProperties = (
  trade: InterfaceTrade,
  allowedSlippage: Percent,
  swapQuoteReceivedDate: Date
) => {
  return {
    ...formatCommonPropertiesForTrade(trade, allowedSlippage),
    swap_quote_block_number: isClassicTrade(trade) ? trade.blockNumber : undefined,
    swap_quote_received_timestamp: swapQuoteReceivedDate.getTime(),
    allowed_slippage_basis_points: formatPercentInBasisPointsNumber(allowedSlippage),
    token_in_amount_max: trade.maximumAmountIn(allowedSlippage).toExact(),
    token_out_amount_min: trade.minimumAmountOut(allowedSlippage).toExact(),
  }
}
