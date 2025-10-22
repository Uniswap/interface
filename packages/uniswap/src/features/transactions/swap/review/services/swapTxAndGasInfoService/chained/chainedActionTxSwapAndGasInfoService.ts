import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import isEqual from 'lodash/isEqual'
import omit from 'lodash/omit'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import type { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { getSwapInputExceedsBalance } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import type { ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { tryCatch } from 'utilities/src/errors'

/**
 * Creates a SwapTxAndGasInfoService for Chained Action trades. Since creating a trade is a non trivial
 * operation we only create 1 trade per quote. When the quote changes, we request a new trade plan,
 * otherwise the existing trade plan is refreshed.
 *
 * @returns SwapTxAndGasInfoService for Chained Action trades
 */
export function createChainedActionSwapTxAndGasInfoService(): SwapTxAndGasInfoService<ChainedActionTrade> {
  let tradeId: string | undefined
  let prevQuote: TradingApi.Quote | undefined
  const service: SwapTxAndGasInfoService<ChainedActionTrade> = {
    async getSwapTxAndGasInfo(params) {
      const { trade, derivedSwapInfo } = params
      const newQuote = trade.quote.quote

      if (!isSameQuote({ newQuote, tradeType: params.trade.tradeType, prevQuote })) {
        tradeId = undefined
      }

      prevQuote = newQuote
      const skip = getSwapInputExceedsBalance({ derivedSwapInfo })

      // TODO SWAP-485 - handle API error cases/skip conditions
      let tradeResponse
      if (tradeId) {
        const { data } = await tryCatch(
          skip ? Promise.resolve(undefined) : TradingApiClient.getExistingTrade({ tradeId }),
        )
        tradeResponse = data
      } else {
        const { data } = await tryCatch(
          skip ? Promise.resolve(undefined) : TradingApiClient.fetchNewTrade({ quote: trade.quote.quote }),
        )
        tradeResponse = data
      }
      // Preserve tradeId if previous fetch was skipped
      tradeId = tradeResponse?.tradeId ?? tradeId

      // TODO: SWAP-476 - add gas fee estimation
      const gasFee: GasFeeResult = {
        value: trade.quote.quote.gasFee,
        displayValue: trade.quote.quote.gasFeeUSD,
        isLoading: false,
        error: null,
      }

      return {
        routing: TradingApi.Routing.CHAINED,
        trade,
        approveTxRequest: undefined,
        revocationTxRequest: undefined,
        gasFee,
        gasFeeEstimation: {},
        includesDelegation: false,
        txRequests: undefined,
        tradeId,
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
