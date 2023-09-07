import { Percent } from '@kinetix/sdk-core'
import { SwapPriceUpdateUserResponse } from '@uniswap/analytics-events'
import { SwapResult } from 'hooks/useSwapCallback'
import {
  formatPercentInBasisPointsNumber,
  formatToDecimal,
  getDurationUntilTimestampSeconds,
  getTokenAddress,
} from 'lib/utils/analytics'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'

import { computeRealizedPriceImpact } from './prices'

export const formatSwapPriceUpdatedEventProperties = (
  trade: InterfaceTrade,
  priceUpdate: number | undefined,
  response: SwapPriceUpdateUserResponse
) => ({
  chain_id:
    trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
      ? trade.inputAmount.currency.chainId
      : undefined,
  response,
  token_in_symbol: trade.inputAmount.currency.symbol,
  token_out_symbol: trade.outputAmount.currency.symbol,
  price_update_basis_points: priceUpdate,
})

interface AnalyticsEventProps {
  trade: InterfaceTrade
  swapResult?: SwapResult
  allowedSlippage: Percent
  transactionDeadlineSecondsSinceEpoch?: number
  isAutoSlippage: boolean
  isAutoRouterApi: boolean
  fiatValueInput?: number
  fiatValueOutput?: number
}

export const formatSwapButtonClickEventProperties = ({
  trade,
  swapResult,
  allowedSlippage,
  transactionDeadlineSecondsSinceEpoch,
  isAutoSlippage,
  isAutoRouterApi,
  fiatValueInput,
  fiatValueOutput,
}: AnalyticsEventProps) => ({
  estimated_network_fee_usd: isClassicTrade(trade) ? trade.gasUseEstimateUSD : undefined,
  transaction_hash: swapResult?.type === TradeFillType.Classic ? swapResult.response.hash : undefined,
  order_hash: undefined,
  transaction_deadline_seconds: getDurationUntilTimestampSeconds(transactionDeadlineSecondsSinceEpoch),
  token_in_address: trade ? getTokenAddress(trade.inputAmount.currency) : undefined,
  token_out_address: trade ? getTokenAddress(trade.outputAmount.currency) : undefined,
  token_in_symbol: trade.inputAmount.currency.symbol,
  token_out_symbol: trade.outputAmount.currency.symbol,
  token_in_amount: trade ? formatToDecimal(trade.inputAmount, trade.inputAmount.currency.decimals) : undefined,
  token_out_amount: trade ? formatToDecimal(trade.outputAmount, trade.outputAmount.currency.decimals) : undefined,
  token_in_amount_usd: fiatValueInput,
  token_out_amount_usd: fiatValueOutput,
  price_impact_basis_points: isClassicTrade(trade)
    ? formatPercentInBasisPointsNumber(computeRealizedPriceImpact(trade))
    : undefined,
  allowed_slippage_basis_points: formatPercentInBasisPointsNumber(allowedSlippage),
  is_auto_router_api: isAutoRouterApi,
  is_auto_slippage: isAutoSlippage,
  chain_id:
    trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
      ? trade.inputAmount.currency.chainId
      : undefined,
  swap_quote_block_number: isClassicTrade(trade) ? trade.blockNumber : undefined,
})
