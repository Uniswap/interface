import type { GasStrategy } from '@universe/api'
import type { TransactionSettings } from 'uniswap/src/features/transactions/components/settings/types'
import type { EVMSwapInstructionsService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'
import { createGetEVMSwapTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/utils'
import type { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { getWrapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import type { UnwrapTrade, WrapTrade } from 'uniswap/src/features/transactions/swap/types/trade'

export function createWrapTxAndGasInfoService(ctx: {
  instructionService: EVMSwapInstructionsService
  gasStrategy: GasStrategy
  transactionSettings: TransactionSettings
  v4SwapEnabled: boolean
}): SwapTxAndGasInfoService<WrapTrade | UnwrapTrade> {
  const getEVMSwapTransactionRequestInfo = createGetEVMSwapTransactionRequestInfo(ctx)

  const service: SwapTxAndGasInfoService<WrapTrade | UnwrapTrade> = {
    async getSwapTxAndGasInfo(params) {
      const swapTxInfo = await getEVMSwapTransactionRequestInfo(params)
      return getWrapTxAndGasInfo({ ...params, swapTxInfo })
    },
  }

  return service
}
