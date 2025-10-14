import { JupiterOrderResponse, TradingApi } from '@universe/api'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'

function getGasValue(quote: JupiterOrderResponse): string {
  if (quote.gasless) {
    return '0'
  }

  return quote.prioritizationFeeLamports.toString()
}

export function createSolanaSwapTxAndGasInfoService(): SwapTxAndGasInfoService<SolanaTrade> {
  const service: SwapTxAndGasInfoService<SolanaTrade> = {
    async getSwapTxAndGasInfo(params) {
      const { trade } = params
      const gasValue = getGasValue(trade.quote.quote)
      const transactionBase64 = trade.quote.quote.transaction ?? undefined

      const gasFee: GasFeeResult = { value: gasValue, displayValue: gasValue, isLoading: false, error: null }

      return {
        routing: TradingApi.Routing.JUPITER,
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
