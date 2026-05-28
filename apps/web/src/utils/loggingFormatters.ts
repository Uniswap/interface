import { SwapPriceUpdateUserResponse } from '@uniswap/analytics-events'
import { Currency, Percent } from '@uniswap/sdk-core'
import { SwapResult } from 'hooks/useSwapCallback'
import {
  formatPercentInBasisPointsNumber,
  formatPercentNumber,
  formatToDecimal,
  getDurationUntilTimestampSeconds,
  getTokenAddress,
} from 'lib/utils/analytics'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { isClassicTrade, isUniswapXTradeType } from 'state/routing/utils'
import { SwapPriceUpdateActionProperties } from 'uniswap/src/features/telemetry/types'
import { TransactionOriginType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { RoutingDiagramEntry } from 'uniswap/src/utils/getRoutingDiagramEntries'
import { computeRealizedPriceImpact } from 'utils/prices'

const formatRoutesEventProperties = (routes?: RoutingDiagramEntry[]) => {
  if (!routes) {
    return {}
  }

  const routesEventProperties: Record<string, any[]> = {
    routes_percentages: [],
    routes_protocols: [],
  }

  routes.forEach((route, index) => {
    routesEventProperties['routes_percentages'].push(formatPercentNumber(route.percent))
    routesEventProperties['routes_protocols'].push(route.protocol)
    routesEventProperties[`route_${index}_input_currency_symbols`] = route.path.map(
      (pathStep) => pathStep[0].symbol ?? '',
    )
    routesEventProperties[`route_${index}_output_currency_symbols`] = route.path.map(
      (pathStep) => pathStep[1].symbol ?? '',
    )
    routesEventProperties[`route_${index}_input_currency_addresses`] = route.path.map((pathStep) =>
      getTokenAddress(pathStep[0]),
    )
    routesEventProperties[`route_${index}_output_currency_addresses`] = route.path.map((pathStep) =>
      getTokenAddress(pathStep[1]),
    )
    routesEventProperties[`route_${index}_fee_amounts_hundredths_of_bps`] = route.path.map((pathStep) => pathStep[2])
  })

  return routesEventProperties
}

export const formatSwapPriceUpdatedEventProperties = (
  trade: InterfaceTrade,
  priceUpdate: number | undefined,
  response: SwapPriceUpdateUserResponse,
): SwapPriceUpdateActionProperties => ({
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
  inputCurrency?: Currency
  swapResult?: SwapResult
  allowedSlippage: Percent
  transactionDeadlineSecondsSinceEpoch?: number
  isAutoSlippage: boolean
  isAutoRouterApi: boolean
  routes?: RoutingDiagramEntry[]
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
  routes,
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
    token_in_address: trade ? getTokenAddress(displayedInputCurrency) : undefined,
    token_out_address: trade ? getTokenAddress(trade.outputAmount.currency) : undefined,
    token_in_symbol: displayedInputCurrency.symbol,
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
    transactionOriginType: TransactionOriginType.Internal,
    chain_id:
      trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
        ? trade.inputAmount.currency.chainId
        : undefined,
    swap_quote_block_number: isClassicTrade(trade) ? trade.blockNumber ?? undefined : undefined,
    ...formatRoutesEventProperties(routes),
  }
}
