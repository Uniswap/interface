import { TradeType } from '@uniswap/sdk-core'
import { GasStrategy, TradingApi } from '@universe/api'
import isEqual from 'lodash/isEqual'
import omit from 'lodash/omit'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import type { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { getSwapInputExceedsBalance } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { ChainedSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { tryCatch } from 'utilities/src/errors'

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
  let prevQuote: TradingApi.Quote | undefined
  const service: SwapTxAndGasInfoService<ChainedActionTrade> = {
    async getSwapTxAndGasInfo(params) {
      const { trade, derivedSwapInfo } = params
      const newQuote = trade.quote.quote

      if (!isSameQuote({ newQuote, tradeType: params.trade.tradeType, prevQuote })) {
        planId = undefined
      }

      prevQuote = newQuote
      const skip = getSwapInputExceedsBalance({ derivedSwapInfo })

      // TODO SWAP-485 - handle API error cases/skip conditions
      let tradeResponse
      if (planId) {
        const { data } = await tryCatch(
          skip ? Promise.resolve(undefined) : TradingApiClient.getExistingPlan({ planId }),
        )
        tradeResponse = data
      } else {
        const { data } = await tryCatch(
          skip
            ? Promise.resolve(undefined)
            : TradingApiClient.createNewPlan({ quote: trade.quote.quote, routing: TradingApi.Routing.CHAINED }),
        )
        tradeResponse = data
      }

      // Preserve tradeId if previous fetch was skipped
      planId = tradeResponse?.planId ?? planId

      // @ts-expect-error TODO API-1530 SWAP-458: once fixed use convertGasFeeToDisplayValue(newQuote.gasFee, newQuote.gasStrategy)
      const gasStrategy: GasStrategy | undefined = newQuote.gasStrategies?.[0]
        ? {
            // @ts-expect-error TODO API-1530 SWAP-458: once fixed use convertGasFeeToDisplayValue(newQuote.gasFee, newQuote.gasStrategy)
            ...newQuote.gasStrategies[0],
            displayLimitInflationFactor: 1,
          }
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

/**
 * Compares the previous and new quotes and returns if they are effectively the same
 * based on user configured fields.
 */
function isSameQuote(params: {
  newQuote: TradingApi.Quote
  tradeType: TradeType
  prevQuote?: TradingApi.Quote
}): boolean {
  const { newQuote, tradeType, prevQuote } = params
  const quoteIsEqualOmit = ['quoteId']
  if (tradeType === TradeType.EXACT_INPUT) {
    quoteIsEqualOmit.push('output.amount')
  } else {
    quoteIsEqualOmit.push('input.amount')
  }

  if (!prevQuote || !isEqual(omit(newQuote, quoteIsEqualOmit), omit(prevQuote, quoteIsEqualOmit))) {
    return false
  }
  return true
}
