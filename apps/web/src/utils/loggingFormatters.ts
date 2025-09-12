import { Currency, Percent } from '@uniswap/sdk-core'
import { SwapResult } from 'hooks/useSwapCallback'
import {
  formatPercentInBasisPointsNumber,
  formatToDecimal,
  getDurationUntilTimestampSeconds,
  getTokenAddress,
} from 'lib/utils/analytics'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { isClassicTrade, isUniswapXTradeType } from 'state/routing/utils'
import { SwapPriceUpdateUserResponse } from 'uniswap/src/features/telemetry/types'
import { TransactionOriginType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { computeRealizedPriceImpact } from 'utils/prices'

export function formatSwapPriceUpdatedEventProperties({
  trade,
  priceUpdate,
  response,
}: {
  trade: InterfaceTrade
  priceUpdate?: number
  response: SwapPriceUpdateUserResponse
}) {
  return {
    chain_id:
      trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
        ? trade.inputAmount.currency.chainId
        : undefined,
    response,
    token_in_symbol: trade.inputAmount.currency.symbol,
    token_out_symbol: trade.outputAmount.currency.symbol,
    price_update_basis_points: priceUpdate,
  }
}

interface AnalyticsEventProps {
  trade: InterfaceTrade
  inputCurrency?: Currency
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
  inputCurrency,
  swapResult,
  allowedSlippage,
  transactionDeadlineSecondsSinceEpoch,
  isAutoSlippage,
  isAutoRouterApi,
  fiatValueInput,
  fiatValueOutput,
}: AnalyticsEventProps) => {
  // trade object sometimes may be the wrapped version of user's native input currency, i.e. for limit orders.
  // For analytics, we want to send the user's original input currency
  const displayedInputCurrency = inputCurrency ?? trade.inputAmount.currency

  return {
    estimated_network_fee_usd: isClassicTrade(trade) ? trade.gasUseEstimateUSD?.toString() : undefined,
    transaction_hash: swapResult?.type === TradeFillType.Classic ? swapResult.response.hash : undefined,
    order_hash: isUniswapXTradeType(swapResult?.type) ? swapResult.response.orderHash : undefined,
    transaction_deadline_seconds: getDurationUntilTimestampSeconds(transactionDeadlineSecondsSinceEpoch),
    token_in_address: getTokenAddress(displayedInputCurrency),
    token_out_address: getTokenAddress(trade.outputAmount.currency),
    token_in_symbol: displayedInputCurrency.symbol,
    token_out_symbol: trade.outputAmount.currency.symbol,
    token_in_amount: formatToDecimal(trade.inputAmount, trade.inputAmount.currency.decimals),
    token_out_amount: formatToDecimal(trade.outputAmount, trade.outputAmount.currency.decimals),
    token_in_amount_usd: fiatValueInput,
    token_out_amount_usd: fiatValueOutput,
    price_impact_basis_points: isClassicTrade(trade)
      ? formatPercentInBasisPointsNumber(computeRealizedPriceImpact(trade))
      : undefined,
    allowed_slippage_basis_points: formatPercentInBasisPointsNumber(allowedSlippage),
    is_auto_router_api: isAutoRouterApi,
    is_auto_slippage: isAutoSlippage,
    transactionOriginType: TransactionOriginType.Internal,
    chain_id:
      trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
        ? trade.inputAmount.currency.chainId
        : undefined,
    swap_quote_block_number: isClassicTrade(trade) ? (trade.blockNumber ?? undefined) : undefined,
  }
}
