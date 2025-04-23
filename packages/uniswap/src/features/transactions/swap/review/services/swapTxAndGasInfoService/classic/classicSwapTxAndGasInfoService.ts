import { Signer } from 'ethers/lib/ethers'
import { NullablePermit } from 'uniswap/src/data/tradingApi/__generated__'
import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { TransactionSettingsContextState } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { signTypedData } from 'uniswap/src/features/transactions/signing'
import { EVMSwapRepository } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import { createGetEVMSwapTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/utils'
import { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { getClassicSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'

export function createClassicSwapTxAndGasInfoService(ctx: {
  swapRepository: EVMSwapRepository
  activeGasStrategy: GasStrategy
  shadowGasStrategies: GasStrategy[]
  transactionSettings: TransactionSettingsContextState
  v4SwapEnabled: boolean
  shouldPresignPermits: boolean
  signer?: Signer
}): SwapTxAndGasInfoService<ClassicTrade> {
  const { signer, shouldPresignPermits } = ctx

  async function getSignature(permitData: NullablePermit): Promise<string | undefined> {
    if (!shouldPresignPermits) {
      return undefined
    }

    const { domain, types, values } = permitData || {}
    if (!domain || !types || !values || !signer) {
      return undefined
    }
    return signTypedData(domain, types, values, signer)
  }

  const getEVMSwapTransactionRequestInfo = createGetEVMSwapTransactionRequestInfo(ctx)

  const service: SwapTxAndGasInfoService<ClassicTrade> = {
    async getSwapTxAndGasInfo(params) {
      const signature = await getSignature(params.trade?.quote?.permitData)
      const swapTxInfo = await getEVMSwapTransactionRequestInfo({ ...params, signature })
      return getClassicSwapTxAndGasInfo({ ...params, swapTxInfo })
    },
  }

  return service
}
