import { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import type { FetchUniswapXSponsoredApproval } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/uniswapx/sponsoredApproval'
import {
  getUniswapXSwapTxAndGasInfo,
  processUniswapXResponse,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/uniswapx/utils'
import { UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'

export function createUniswapXSwapTxAndGasInfoService(ctx?: {
  fetchSponsoredApproval?: FetchUniswapXSponsoredApproval
}): SwapTxAndGasInfoService<UniswapXTrade> {
  const service: SwapTxAndGasInfoService<UniswapXTrade> = {
    async getSwapTxAndGasInfo(params) {
      const permitData = params.trade.quote.permitData

      const swapTxInfo = processUniswapXResponse({ permitData })
      const sponsoredApproval = await ctx?.fetchSponsoredApproval?.({
        trade: params.trade,
        approvalTxInfo: params.approvalTxInfo,
      })
      return getUniswapXSwapTxAndGasInfo({ ...params, swapTxInfo, sponsoredApproval })
    },
  }

  return service
}
