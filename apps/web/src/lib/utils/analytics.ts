import { Currency, CurrencyAmount, Percent, Price, Token } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import type { RWAWhitelist } from 'uniswap/src/features/rwa/types'
import { PriceSourceTag, SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { getRouteAnalyticsData, tradeRoutingToFillType } from 'uniswap/src/features/transactions/swap/analytics'
import { planAnalyticsToSnakeCase } from 'uniswap/src/features/transactions/swap/plan/types'
import { getRwaSwapAnalyticsProperties } from 'uniswap/src/features/transactions/swap/rwaSwapAnalytics'
import {
  BridgeTrade,
  ChainedActionTrade,
  ClassicTrade,
  getTradeInputTax,
  getTradeOutputTax,
  UniswapXTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  type PlanSwapTransactionInfoFields,
  TransactionOriginType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { InterfaceTrade, OffchainOrderType, QuoteMethod, SubmittableTrade } from '~/state/routing/types'
import { isClassicTrade, isSubmittableTrade, isUniswapXTrade } from '~/state/routing/utils'
import { computeRealizedPriceImpact } from '~/utils/prices'

export const getDurationUntilTimestampSeconds = (futureTimestampInSecondsSinceEpoch?: number): number | undefined => {
  if (!futureTimestampInSecondsSinceEpoch) {
    return undefined
  }
  return futureTimestampInSecondsSinceEpoch - new Date().getTime() / 1000
}

export const formatToDecimal = (
  intialNumberObject: Percent | CurrencyAmount<Token | Currency>,
  decimalPlace: number,
): number => parseFloat(intialNumberObject.toFixed(decimalPlace))

export const getTokenAddress = (currency: Currency) => (currency.isNative ? NATIVE_CHAIN_ID : currency.address)

export const formatPercentInBasisPointsNumber = (percent: Percent): number => parseFloat(percent.toFixed(2)) * 100

const formatPercentNumber = (percent: Percent): number => parseFloat(percent.toFixed(2))

export const getPriceUpdateBasisPoints = (
  prevPrice: Price<Currency, Currency>,
  newPrice: Price<Currency, Currency>,
): number => {
  const changeFraction = newPrice.subtract(prevPrice).divide(prevPrice)
  const changePercentage = new Percent(changeFraction.numerator, changeFraction.denominator)
  return formatPercentInBasisPointsNumber(changePercentage)
}

function getEstimatedNetworkFee(trade: InterfaceTrade) {
  if (isClassicTrade(trade)) {
    return trade.gasUseEstimateUSD
  }
  if (isUniswapXTrade(trade)) {
    return trade.classicGasUseEstimateUSD
  }
  return undefined
}

type UniversalSwapFlowTrade = ClassicTrade | UniswapXTrade | BridgeTrade | ChainedActionTrade

function isUniversalSwapFlowTrade(trade: InterfaceTrade | UniversalSwapFlowTrade): trade is UniversalSwapFlowTrade {
  return 'routing' in trade
}

function getUniversalQuoteId(trade: UniversalSwapFlowTrade): string | undefined {
  return 'quoteId' in trade.quote.quote ? trade.quote.quote.quoteId : undefined
}

type CommonAnalyticsTrade = InterfaceTrade | UniversalSwapFlowTrade

function getAnalyticsQuoteId(trade: CommonAnalyticsTrade): string | undefined {
  if (isUniversalSwapFlowTrade(trade)) {
    return getUniversalQuoteId(trade)
  }
  return isUniswapXTrade(trade) ? trade.quoteId : undefined
}

function getAnalyticsRequestId(trade: CommonAnalyticsTrade): string | undefined {
  if (isUniversalSwapFlowTrade(trade)) {
    return trade.quote.requestId
  }
  return isSubmittableTrade(trade) ? trade.requestId : undefined
}

function getAnalyticsQuoteBlockNumber(trade: CommonAnalyticsTrade): string | undefined {
  if (isUniversalSwapFlowTrade(trade)) {
    return isClassic(trade) ? trade.quote.quote.blockNumber : undefined
  }
  return isClassicTrade(trade) ? (trade.blockNumber ?? undefined) : undefined
}

function getPriceImpactBasisPoints(trade: CommonAnalyticsTrade): number | undefined {
  if (isUniversalSwapFlowTrade(trade)) {
    return isClassic(trade) && trade.priceImpact ? formatPercentInBasisPointsNumber(trade.priceImpact) : undefined
  }
  return isClassicTrade(trade) ? formatPercentInBasisPointsNumber(computeRealizedPriceImpact(trade)) : undefined
}

function getAnalyticsEstimatedNetworkFeeUsd(trade: CommonAnalyticsTrade): string | undefined {
  if (isUniversalSwapFlowTrade(trade)) {
    return isClassic(trade) ? trade.quote.quote.gasFeeUSD : undefined
  }
  return getEstimatedNetworkFee(trade)?.toString()
}

function getMinimumOutputAfterSlippage(trade: CommonAnalyticsTrade, allowedSlippage: Percent): string | undefined {
  if (isUniversalSwapFlowTrade(trade)) {
    return isClassic(trade) ? trade.minAmountOut.toSignificant(6) : undefined
  }
  return isClassicTrade(trade) ? trade.minimumAmountOut(allowedSlippage).toSignificant(6) : undefined
}

function getOutputDetectedTax(trade: CommonAnalyticsTrade): number | undefined {
  if (isUniversalSwapFlowTrade(trade)) {
    const outputTax = getTradeOutputTax(trade)
    return outputTax ? formatPercentNumber(outputTax) : undefined
  }
  return formatPercentNumber(trade.outputTax)
}

function getInputDetectedTax(trade: CommonAnalyticsTrade): number | undefined {
  if (isUniversalSwapFlowTrade(trade)) {
    const inputTax = getTradeInputTax(trade)
    return inputTax ? formatPercentNumber(inputTax) : undefined
  }
  return formatPercentNumber(trade.inputTax)
}

function getAnalyticsOffchainOrderType(trade: CommonAnalyticsTrade): OffchainOrderType | undefined {
  if (isUniversalSwapFlowTrade(trade)) {
    return tradeRoutingToOffchainOrderType(trade.routing)
  }
  return isUniswapXTrade(trade) ? trade.offchainOrderType : undefined
}

function tradeRoutingToOffchainOrderType(routing: TradingApi.Routing): OffchainOrderType | undefined {
  switch (routing) {
    case TradingApi.Routing.DUTCH_V2:
      return OffchainOrderType.DUTCH_V2_AUCTION
    case TradingApi.Routing.DUTCH_LIMIT:
    case TradingApi.Routing.LIMIT_ORDER:
      return OffchainOrderType.LIMIT_ORDER
    default:
      return undefined
  }
}

export function formatCommonPropertiesForTrade({
  trade,
  allowedSlippage,
  outputFeeFiatValue,
  isBatched,
  batchId,
  includedPermitTransactionStep,
  rwaWhitelist,
}: {
  trade: InterfaceTrade | ClassicTrade | UniswapXTrade | BridgeTrade | ChainedActionTrade
  allowedSlippage: Percent
  outputFeeFiatValue?: number
  isBatched?: boolean
  batchId?: string
  includedPermitTransactionStep?: boolean
  rwaWhitelist?: RWAWhitelist
}): SwapTradeBaseProperties {
  const isUniversalSwapFlow = isUniversalSwapFlowTrade(trade)

  return {
    ...getRwaSwapAnalyticsProperties({
      inputCurrency: trade.inputAmount.currency,
      outputCurrency: trade.outputAmount.currency,
      priceImpactBasisPoints: getPriceImpactBasisPoints(trade),
      rwaWhitelist,
    }),
    routing: isUniversalSwapFlow ? tradeRoutingToFillType(trade) : trade.fillType,
    type: trade.tradeType,
    ura_quote_id: getAnalyticsQuoteId(trade),
    ura_request_id: getAnalyticsRequestId(trade),
    ura_quote_block_number: getAnalyticsQuoteBlockNumber(trade),
    token_in_address: getTokenAddress(trade.inputAmount.currency),
    token_out_address: getTokenAddress(trade.outputAmount.currency),
    token_in_symbol: trade.inputAmount.currency.symbol,
    token_out_symbol: trade.outputAmount.currency.symbol,
    token_in_amount: formatToDecimal(trade.inputAmount, trade.inputAmount.currency.decimals),
    token_out_amount: formatToDecimal(trade.outputAmount, trade.outputAmount.currency.decimals),
    price_impact_basis_points: getPriceImpactBasisPoints(trade),
    chain_id:
      trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
        ? trade.inputAmount.currency.chainId
        : undefined,
    chain_id_in: trade.inputAmount.currency.chainId,
    chain_id_out: trade.outputAmount.currency.chainId,
    estimated_network_fee_usd: getAnalyticsEstimatedNetworkFeeUsd(trade),
    minimum_output_after_slippage: getMinimumOutputAfterSlippage(trade, allowedSlippage),
    allowed_slippage: formatPercentNumber(allowedSlippage),
    method: isUniversalSwapFlow ? undefined : getQuoteMethod(trade),
    fee_usd: outputFeeFiatValue,
    token_out_detected_tax: getOutputDetectedTax(trade),
    token_in_detected_tax: getInputDetectedTax(trade),
    offchain_order_type: getAnalyticsOffchainOrderType(trade),
    transactionOriginType: TransactionOriginType.Internal,
    is_batch: isBatched,
    batch_id: batchId,
    included_permit_transaction_step: includedPermitTransactionStep,
  }
}

export const formatSwapSignedAnalyticsEventProperties = ({
  trade,
  allowedSlippage,
  fiatValues,
  txHash,
  timeToSignSinceRequestMs,
  portfolioBalanceUsd,
  trace,
  isBatched,
  batchId,
  includedPermitTransactionStep,
  planAnalytics,
  priceSource,
  rwaWhitelist,
}: {
  trade: SubmittableTrade | ClassicTrade | UniswapXTrade | BridgeTrade | ChainedActionTrade
  allowedSlippage: Percent
  fiatValues: { amountIn?: number; amountOut?: number; feeUsd?: number }
  txHash?: string
  timeToSignSinceRequestMs?: number
  portfolioBalanceUsd?: number
  trace: ITraceContext
  isBatched?: boolean
  batchId?: string
  includedPermitTransactionStep?: boolean
  planAnalytics?: PlanSwapTransactionInfoFields
  priceSource?: PriceSourceTag
  rwaWhitelist?: RWAWhitelist
}) => ({
  ...trace,
  total_balances_usd: portfolioBalanceUsd,
  transaction_hash: txHash,
  token_in_amount_usd: fiatValues.amountIn,
  token_out_amount_usd: fiatValues.amountOut,
  // measures the amount of time the user took to sign the permit message or swap tx in their wallet
  time_to_sign_since_request_ms: timeToSignSinceRequestMs,
  ...planAnalyticsToSnakeCase(planAnalytics),
  ...('routing' in trade ? getRouteAnalyticsData(trade) : undefined),
  ...formatCommonPropertiesForTrade({
    trade,
    allowedSlippage,
    outputFeeFiatValue: fiatValues.feeUsd,
    isBatched,
    batchId,
    includedPermitTransactionStep,
    rwaWhitelist,
  }),
  // Override routing with per-step routing for plan steps
  ...(planAnalytics?.stepRouting ? { routing: planAnalytics.stepRouting } : {}),
  price_source: priceSource,
})

function getQuoteMethod(trade: InterfaceTrade) {
  if (isUniswapXTrade(trade)) {
    return QuoteMethod.ROUTING_API
  }

  return trade.quoteMethod
}
