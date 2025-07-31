import { Routing } from 'uniswap/src/data/tradingApi/__generated__/models/Routing'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'

export function createSolanaSwapTxAndGasInfoService(): SwapTxAndGasInfoService<SolanaTrade> {
  const service: SwapTxAndGasInfoService<SolanaTrade> = {
    async getSwapTxAndGasInfo(params) {
      const { trade } = params
      const gasValue = trade.quote.quote.prioritizationFeeLamports.toString()
      const transactionBase64 = trade.quote.quote.transaction ?? undefined

      const gasFee: GasFeeResult = { value: gasValue, displayValue: gasValue, isLoading: false, error: null }

      return {
        routing: Routing.JUPITER,
        trade,
        gasFee,
        gasFeeEstimation: {},
        includesDelegation: false,
        approveTxRequest: undefined,
        revocationTxRequest: undefined,
        transactionBase64,
      }
    },
  }

  return service
}
