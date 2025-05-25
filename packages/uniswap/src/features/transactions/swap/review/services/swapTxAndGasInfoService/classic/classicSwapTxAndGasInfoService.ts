import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { TransactionSettingsContextState } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { EVMSwapInstructionsService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'
import { createGetEVMSwapTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/utils'
import { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import {
  createGetPermitTxInfo,
  getClassicSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'

export function createClassicSwapTxAndGasInfoService(ctx: {
  instructionService: EVMSwapInstructionsService
  activeGasStrategy: GasStrategy
  transactionSettings: TransactionSettingsContextState
}): SwapTxAndGasInfoService<ClassicTrade> {
  const getEVMSwapTransactionRequestInfo = createGetEVMSwapTransactionRequestInfo(ctx)
  const getPermitTxInfo = createGetPermitTxInfo(ctx)

  const service: SwapTxAndGasInfoService<ClassicTrade> = {
    async getSwapTxAndGasInfo(params) {
      const swapTxInfo = await getEVMSwapTransactionRequestInfo(params)
      const permitTxInfo = getPermitTxInfo(params.trade)

      return getClassicSwapTxAndGasInfo({ ...params, swapTxInfo, permitTxInfo })
    },
  }

  return service
}
