import { GasStrategy, TradingApi } from '@universe/api'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import type { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { ChainedSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'

const UNUSED_CHAINED_ACTIONS_FIELDS: Pick<
  ChainedSwapTxAndGasInfo,
  'approveTxRequest' | 'revocationTxRequest' | 'txRequests'
> = {
  approveTxRequest: undefined,
  revocationTxRequest: undefined,
  txRequests: undefined,
}
/**
 * Creates a SwapTxAndGasInfoService for Chained Action trades. Since creating a trade is a non trivial
 * operation we only create 1 trade per quote. When the quote changes, we request a new trade plan,
 * otherwise the existing trade plan is refreshed.
 *
 * @returns SwapTxAndGasInfoService for Chained Action trades
 */
export function createChainedActionSwapTxAndGasInfoService(): SwapTxAndGasInfoService<ChainedActionTrade> {
  let planId: string | undefined
  let prevQuoteHash: string | undefined
  const service: SwapTxAndGasInfoService<ChainedActionTrade> = {
    async getSwapTxAndGasInfo(params) {
      const { trade, derivedSwapInfo } = params
      const newQuote = trade.quote.quote

      const newQuoteHash = derivedSwapInfo.trade.quoteHash

      if (newQuoteHash !== prevQuoteHash) {
        planId = undefined
      }

      prevQuoteHash = newQuoteHash

      // We're skipping the plan creation for now until we decide on whether we
      // want the quote to pass a metaroute to createOrGetPlan()
      //
      // const skip = getSwapInputExceedsBalance({ derivedSwapInfo })
      //
      // const tradeResponse = skip
      //   ? undefined
      //   : await createOrGetPlan({
      //       inputPlanId: planId,
      //       quote: trade.quote.quote,
      //       routing: TradingApi.Routing.CHAINED,
      //     })
      // // Preserve tradeId if previous fetch was skipped
      // planId = tradeResponse?.planId ?? planId

      const gasStrategy: GasStrategy | undefined = newQuote.gasEstimates?.[0]
        ? { ...newQuote.gasEstimates[0].strategy, displayLimitInflationFactor: 1 }
        : undefined

      const gasFee: GasFeeResult = {
        value: newQuote.gasFee,
        displayValue: convertGasFeeToDisplayValue(newQuote.gasFee, gasStrategy),
        isLoading: false,
        error: null,
      }

      return {
        ...UNUSED_CHAINED_ACTIONS_FIELDS,
        routing: TradingApi.Routing.CHAINED,
        trade,
        gasFee,
        gasFeeEstimation: {},
        includesDelegation: false,
        planId,
      }
    },
  }

  return service
}
