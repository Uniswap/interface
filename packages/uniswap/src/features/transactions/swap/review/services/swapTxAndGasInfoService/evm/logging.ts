import { TradingApi } from '@universe/api'
import type { TransactionSettings } from 'uniswap/src/features/transactions/components/settings/types'
import type { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { createLogSwapRequestErrors } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import type { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

const swapFlowTxIdToRecentRequestIdMap = new Map<string, string>()

/** Decorates a SwapTxAndGasInfoService with necessary logging for EVM swap flow requests. */
export function createDecorateSwapTxInfoServiceWithEVMLogging(ctx: {
  trace: ITraceContext
  transactionSettings: TransactionSettings
}): <T extends Trade>(service: SwapTxAndGasInfoService<T>) => SwapTxAndGasInfoService<T> {
  const { trace, transactionSettings } = ctx
  const logSwapRequestErrors = createLogSwapRequestErrors({ trace })

  return function decorateService<T extends Trade>(service: SwapTxAndGasInfoService<T>): SwapTxAndGasInfoService<T> {
    const decoratedService: SwapTxAndGasInfoService<T> = {
      async getSwapTxAndGasInfo(params) {
        const result = await service.getSwapTxAndGasInfo(params)

        if (result.routing === TradingApi.Routing.CLASSIC || result.routing === TradingApi.Routing.BRIDGE) {
          const { derivedSwapInfo } = params
          const { txId } = derivedSwapInfo
          const previousRequestId = txId ? swapFlowTxIdToRecentRequestIdMap.get(txId) : undefined

          logSwapRequestErrors({
            txRequest: result.txRequests?.[0],
            gasFeeResult: result.gasFee,
            derivedSwapInfo,
            transactionSettings,
            previousRequestId,
          })

          if (txId) {
            swapFlowTxIdToRecentRequestIdMap.set(txId, params.trade.quote.requestId)
          }
        }

        return result
      },
    }
    return decoratedService
  }
}
