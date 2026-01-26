import type { GasStrategy } from '@universe/api'
import type { TransactionSettings } from 'uniswap/src/features/transactions/components/settings/types'
import type { EVMSwapInstructionsService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'
import { createGetEVMSwapTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/utils'
import type { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import {
  createGetPermitTxInfo,
  getClassicSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import type { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'

export function createClassicSwapTxAndGasInfoService(ctx: {
  instructionService: EVMSwapInstructionsService
  gasStrategy: GasStrategy
  transactionSettings: TransactionSettings
}): SwapTxAndGasInfoService<ClassicTrade> {
  const getEVMSwapTransactionRequestInfo = createGetEVMSwapTransactionRequestInfo(ctx)
  const getPermitTxInfo = createGetPermitTxInfo(ctx)

  const service: SwapTxAndGasInfoService<ClassicTrade> = {
    async getSwapTxAndGasInfo(params) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[execute] classicSwapTxAndGasInfoService.getSwapTxAndGasInfo called:', {
          hasTrade: !!params.trade,
          routing: params.trade?.routing,
          hasApprovalTxInfo: !!params.approvalTxInfo,
          hasDerivedSwapInfo: !!params.derivedSwapInfo,
        })
      }

      const swapTxInfo = await getEVMSwapTransactionRequestInfo(params)

      if (process.env.NODE_ENV === 'development') {
        console.log('[execute] classicSwapTxAndGasInfoService - Got swapTxInfo:', {
          hasSwapTxInfo: !!swapTxInfo,
          hasSwapRequestArgs: !!swapTxInfo.swapRequestArgs,
          swapRequestArgs: swapTxInfo.swapRequestArgs ? {
            deadline: swapTxInfo.swapRequestArgs.deadline,
            deadlineDate: swapTxInfo.swapRequestArgs.deadline ? new Date(swapTxInfo.swapRequestArgs.deadline * 1000).toLocaleString('zh-CN') : undefined,
            hasQuote: !!swapTxInfo.swapRequestArgs.quote,
            simulateTransaction: swapTxInfo.swapRequestArgs.simulateTransaction,
            allKeys: Object.keys(swapTxInfo.swapRequestArgs),
          } : 'swapRequestArgs is undefined',
          hasTxRequests: !!swapTxInfo.txRequests,
          txRequestCount: swapTxInfo.txRequests?.length || 0,
        })
      }

      const permitTxInfo = getPermitTxInfo(params.trade)

      return getClassicSwapTxAndGasInfo({ ...params, swapTxInfo, permitTxInfo })
    },
  }

  return service
}
