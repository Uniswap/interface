import { TradingApi } from '@universe/api'
import type { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'

export type SwapTxAndGasInfoParameters<T extends Trade = Trade> = {
  derivedSwapInfo: DerivedSwapInfo
  trade: T
  approvalTxInfo: ApprovalTxInfo
}

export interface SwapTxAndGasInfoService<T extends Trade = Trade> {
  getSwapTxAndGasInfo: (ctx: SwapTxAndGasInfoParameters<T>) => Promise<SwapTxAndGasInfo>
}

export type RoutingServicesMap = { [K in TradingApi.Routing]: SwapTxAndGasInfoService<Trade & { routing: K }> }

export function createSwapTxAndGasInfoService(ctx: { services: RoutingServicesMap }): SwapTxAndGasInfoService<Trade> {
  function getServiceForTrade<T extends Trade>(trade: T): SwapTxAndGasInfoService<T> {
    const service = ctx.services[trade.routing]
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!service) {
      throw new Error(`Unsupported routing: ${trade.routing}`)
    }
    return service as SwapTxAndGasInfoService<T>
  }

  const service: SwapTxAndGasInfoService<Trade> = {
    async getSwapTxAndGasInfo(params) {
      const { trade } = params
      return getServiceForTrade(trade).getSwapTxAndGasInfo({ ...params, trade })
    },
  }

  return service
}
