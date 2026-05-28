import { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import {
  getUniswapXSwapTxAndGasInfo,
  processUniswapXResponse,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/uniswapx/utils'
import { UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'

export function createUniswapXSwapTxAndGasInfoService(): SwapTxAndGasInfoService<UniswapXTrade> {
  const service: SwapTxAndGasInfoService<UniswapXTrade> = {
    async getSwapTxAndGasInfo(params) {
      const permitData = params.trade.quote.permitData

      const swapTxInfo = processUniswapXResponse({ permitData })
      return getUniswapXSwapTxAndGasInfo({ ...params, swapTxInfo })
    },
  }

  return service
}
