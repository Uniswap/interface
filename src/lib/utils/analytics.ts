import { Trade } from '@thinkincoin/router-sdk'
import { Currency, CurrencyAmount, Percent, Price, Token, TradeType } from '@thinkincoin-libs/sdk-core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { InterfaceTrade, QuoteMethod } from 'state/routing/types'
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

export const formatSwapSignedAnalyticsEventProperties = ({
  trade,
  allowedSlippage,
  fiatValues,
  txHash,
}: {
  trade: InterfaceTrade | Trade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  fiatValues: { amountIn?: number; amountOut?: number }
  txHash: string
}) => ({
  transaction_hash: txHash,
  token_in_amount_usd: fiatValues.amountIn,
  token_out_amount_usd: fiatValues.amountOut,
  ...formatEventPropertiesForTrade(trade, allowedSlippage),
})

export const formatEventPropertiesForTrade = (
  trade: Trade<Currency, Currency, TradeType>,
  allowedSlippage: Percent,
  gasUseEstimateUSD?: string,
  method?: QuoteMethod
) => {
  return {
    token_in_symbol: trade.inputAmount.currency.symbol,
    token_out_symbol: trade.outputAmount.currency.symbol,
    token_in_address: getTokenAddress(trade.inputAmount.currency),
    token_out_address: getTokenAddress(trade.outputAmount.currency),
    price_impact_basis_points: trade ? formatPercentInBasisPointsNumber(computeRealizedPriceImpact(trade)) : undefined,
    estimated_network_fee_usd: gasUseEstimateUSD,
    chain_id:
      trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
        ? trade.inputAmount.currency.chainId
        : undefined,
    token_in_amount: formatToDecimal(trade.inputAmount, trade.inputAmount.currency.decimals),
    token_out_amount: formatToDecimal(trade.outputAmount, trade.outputAmount.currency.decimals),
    minimum_output_after_slippage: trade.minimumAmountOut(allowedSlippage).toSignificant(6),
    allowed_slippage: formatPercentNumber(allowedSlippage),
    method,
  }
}
