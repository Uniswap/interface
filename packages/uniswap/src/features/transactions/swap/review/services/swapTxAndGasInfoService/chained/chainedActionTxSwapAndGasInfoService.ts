import { TradingApi } from '@universe/api'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import type { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import type { ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'

export function createChainedActionSwapTxAndGasInfoService(): SwapTxAndGasInfoService<ChainedActionTrade> {
  const service: SwapTxAndGasInfoService<ChainedActionTrade> = {
    async getSwapTxAndGasInfo(params) {
      const { trade } = params

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
      }
    },
  }

  return service
}
