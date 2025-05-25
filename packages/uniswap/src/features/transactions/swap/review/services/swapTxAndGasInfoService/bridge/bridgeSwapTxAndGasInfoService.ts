import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { TransactionSettingsContextState } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { EVMSwapInstructionsService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'
import { createGetEVMSwapTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/utils'
import { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { getBridgeSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'

export function createBridgeSwapTxAndGasInfoService(ctx: {
  instructionService: EVMSwapInstructionsService
  activeGasStrategy: GasStrategy
  shadowGasStrategies: GasStrategy[]
  transactionSettings: TransactionSettingsContextState
  v4SwapEnabled: boolean
}): SwapTxAndGasInfoService<BridgeTrade> {
  const getEVMSwapTransactionRequestInfo = createGetEVMSwapTransactionRequestInfo(ctx)

  const service: SwapTxAndGasInfoService<BridgeTrade> = {
    async getSwapTxAndGasInfo(params) {
      const swapTxInfo = await getEVMSwapTransactionRequestInfo(params)
      return getBridgeSwapTxAndGasInfo({ ...params, swapTxInfo })
    },
  }

  return service
}
