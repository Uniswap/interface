import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { InterfaceTrade } from 'state/routing/types'

import { formatPercentInBasisPointsNumber, formatToDecimal, getTokenAddress } from './analytics'
import { computeRealizedPriceImpact } from './prices'

export const formatSwapSignedAnalyticsEventProperties = ({
  trade,
  fiatValues,
  txHash,
}: {
  trade: InterfaceTrade | Trade<Currency, Currency, TradeType>
  fiatValues: { amountIn?: number; amountOut?: number }
  txHash: string
}) => ({
  transaction_hash: txHash,
  token_in_address: getTokenAddress(trade.inputAmount.currency),
  token_out_address: getTokenAddress(trade.outputAmount.currency),
  token_in_symbol: trade.inputAmount.currency.symbol,
  token_out_symbol: trade.outputAmount.currency.symbol,
  token_in_amount: formatToDecimal(trade.inputAmount, trade.inputAmount.currency.decimals),
  token_out_amount: formatToDecimal(trade.outputAmount, trade.outputAmount.currency.decimals),
  token_in_amount_usd: fiatValues.amountIn,
  token_out_amount_usd: fiatValues.amountOut,
  price_impact_basis_points: formatPercentInBasisPointsNumber(computeRealizedPriceImpact(trade)),
  chain_id:
    trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
      ? trade.inputAmount.currency.chainId
      : undefined,
})

export const formatSwapQuoteReceivedEventProperties = (
  trade: Trade<Currency, Currency, TradeType>,
  gasUseEstimateUSD?: string
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
  }
}
