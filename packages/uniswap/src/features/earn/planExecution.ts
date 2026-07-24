import { type Currency } from '@uniswap/sdk-core'
import { type ChainedQuoteResponse, TradingApi } from '@universe/api'
import { createEarnChainedActionDisplayAmounts } from 'uniswap/src/features/earn/chainedDisplayAmounts'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/convertGasFeeToDisplayValue'
import { getDisplayGasStrategy } from 'uniswap/src/features/gas/utils'
import type { EarnPlanAnalyticsFields, PlanSagaAnalytics } from 'uniswap/src/features/transactions/swap/plan/types'
import type { ValidatedChainedSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { createChainedActionTrade, type ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { TransactionOriginType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getCurrencyAddressForAnalytics } from 'uniswap/src/utils/currencyId'

const EARN_PLAN_ANALYTICS_ROUTING: PlanSagaAnalytics['routing'] = 'chained'

type EarnPlanSagaAnalytics = PlanSagaAnalytics & EarnPlanAnalyticsFields

/**
 * Displayable error the earn review surfaces show when plan execution stops because the refreshed quote
 * moved beyond the accepted price threshold. The earn execute callbacks (web `useEarnSagaCallback`,
 * mobile `useEarnExecuteCallback`) construct it with a translated message from the saga's silent
 * `PlanPriceChangeInterrupt`, producing a "review the updated quote and try again" state in the modal.
 */
export class EarnPlanPriceChangeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EarnPlanPriceChangeError'
  }
}

export function getEarnExecutionErrorMessage({
  error,
  fallback,
}: {
  error: Error | undefined
  fallback: string
}): string | undefined {
  if (!error) {
    return undefined
  }
  return error instanceof EarnPlanPriceChangeError ? error.message : fallback
}

export function shouldShowEarnTroubleshootingLink(error: Error | undefined): boolean {
  if (!error || error instanceof EarnPlanPriceChangeError) {
    return false
  }

  const code = (error as Error & { code?: unknown }).code
  if (code === 4001 || code === '4001' || code === 5750 || code === '5750' || code === 'ACTION_REJECTED') {
    return false
  }

  const rejectionText = `${error.name} ${error.message}`.toLowerCase()
  return ![
    'user rejected',
    'user denied',
    'user canceled',
    'user cancelled',
    'canceled by user',
    'cancelled by user',
    'request rejected',
    'request declined',
    'closed modal',
    'transaction cancelled',
    'connection rejected',
  ].some((message) => rejectionText.includes(message))
}
export function buildEarnChainedActionTrade({
  currencyIn,
  currencyOut,
  earnIntent,
  quote,
}: {
  currencyIn: Currency
  currencyOut: Currency
  earnIntent: TradingApi.EarnIntent
  quote: ChainedQuoteResponse
}): ChainedActionTrade {
  const earnDisplayAmounts = createEarnChainedActionDisplayAmounts({
    quote,
    currencyIn,
    currencyOut,
    earnIntent,
  })
  if (!earnDisplayAmounts) {
    throw new Error('Unable to build Earn chained action trade')
  }

  const trade = createChainedActionTrade({
    quote,
    currencyIn,
    currencyOut,
    earnIntent,
    displayAmountsOverride: earnDisplayAmounts,
  })

  if (!trade) {
    throw new Error('Unable to build Earn chained action trade')
  }

  return trade
}

export function buildEarnSwapTxContext(trade: ChainedActionTrade): ValidatedChainedSwapTxAndGasInfo {
  const quote = trade.quote.quote
  const gasFee = quote.gasFee ?? '0'
  const gasStrategy = getDisplayGasStrategy(quote.gasEstimates?.[0]?.strategy)

  return {
    routing: TradingApi.Routing.CHAINED,
    trade,
    planId: undefined,
    txRequests: undefined,
    approveTxRequest: undefined,
    revocationTxRequest: undefined,
    includesDelegation: false,
    gasFee: {
      value: gasFee,
      displayValue: convertGasFeeToDisplayValue({ gasFee, gasStrategy }),
      isLoading: false,
      error: null,
    },
    gasFeeEstimation: {},
  }
}

export function buildEarnPlanAnalytics(trade: ChainedActionTrade): EarnPlanSagaAnalytics {
  return {
    transactionOriginType: TransactionOriginType.Internal,
    routing: EARN_PLAN_ANALYTICS_ROUTING,
    chain_id:
      trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
        ? trade.inputAmount.currency.chainId
        : undefined,
    chain_id_in: trade.inputAmount.currency.chainId,
    chain_id_out: trade.outputAmount.currency.chainId,
    token_in_symbol: trade.inputAmount.currency.symbol,
    token_out_symbol: trade.outputAmount.currency.symbol,
    token_in_address: getCurrencyAddressForAnalytics(trade.inputAmount.currency),
    token_out_address: getCurrencyAddressForAnalytics(trade.outputAmount.currency),
    token_in_amount: trade.inputAmount.toExact(),
    token_out_amount: trade.outputAmount.toExact(),
    token_in_amount_max: trade.maxAmountIn.toExact(),
    token_out_amount_min: trade.minAmountOut.toExact(),
    allowed_slippage: trade.slippageTolerance,
    allowed_slippage_basis_points: trade.slippageTolerance * 100,
    requestId: trade.quote.requestId,
    quoteId: trade.quote.quote.quoteId,
    type: trade.tradeType,
    earn_action: trade.earnIntent?.action,
    earn_vault_address: trade.earnIntent?.vault,
    earn_vault_chain_id: trade.earnIntent?.chainId,
    earn_withdraw_mode: trade.earnIntent?.withdrawMode,
  }
}
