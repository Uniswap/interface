import type { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import type { AccountMeta } from 'uniswap/src/features/accounts/types'
import type { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/contexts/hooks/useTokenApprovalInfo'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'

export type SwapTxAndGasInfoParameters<T extends Trade | undefined> = {
  account?: AccountMeta
  derivedSwapInfo: DerivedSwapInfo
  trade: T
  approvalTxInfo: ApprovalTxInfo
}

export interface SwapTxAndGasInfoService<T extends Trade | undefined> {
  getSwapTxAndGasInfo: (ctx: SwapTxAndGasInfoParameters<T>) => Promise<SwapTxAndGasInfo>
}

export type RoutingServicesMap = { [K in Routing]: SwapTxAndGasInfoService<Trade & { routing: K }> }

export function createSwapTxAndGasInfoService(ctx: {
  services: RoutingServicesMap
  tradelessWrapService: SwapTxAndGasInfoService<undefined>
}): SwapTxAndGasInfoService<Trade | undefined> {
  function getServiceForTrade<T extends Trade>(trade: T): SwapTxAndGasInfoService<T> {
    const service = ctx.services[trade.routing]
    if (!service) {
      throw new Error(`Unsupported routing: ${trade.routing}`)
    }
    return service as SwapTxAndGasInfoService<T>
  }

  const service: SwapTxAndGasInfoService<Trade | undefined> = {
    async getSwapTxAndGasInfo(params) {
      const { trade, derivedSwapInfo } = params
      // TODO(WEB-7243): Remove special casing for wraps once we have a Trade variant for wraps
      if (!trade) {
        if (derivedSwapInfo.wrapType !== WrapType.NotApplicable) {
          return ctx.tradelessWrapService.getSwapTxAndGasInfo({ ...params, trade })
        }
        throw new Error('Trade is undefined')
      }

      return getServiceForTrade(trade).getSwapTxAndGasInfo({ ...params, trade })
    },
  }

  return service
}
