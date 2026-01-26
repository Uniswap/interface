import { TransactionRequest } from '@ethersproject/providers'
import { GasEstimate, TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'

export type SwapData = {
  requestId: string
  transactions: TransactionRequest[]
  gasFee?: string
  gasEstimate?: GasEstimate
  includesDelegation?: boolean
}
export interface EVMSwapRepository {
  fetchSwapData: (params: TradingApi.CreateSwapRequest) => Promise<SwapData>
}

/**
 * HashKey chains (133, 177) do not use swap API.
 * Transactions are built directly from quote methodParameters using buildTxRequestFromTrade.
 * This repository should never be called for HashKey chains.
 */
export function createLegacyEVMSwapRepository(): EVMSwapRepository {
  return {
    fetchSwapData: async () => {
      throw new Error('Swap API is not used for HashKey chains. Transactions should be built from quote methodParameters.')
    },
  }
}

/**
 * HashKey chains (133, 177) do not use swap API.
 * This repository should never be called for HashKey chains.
 */
export function create7702EVMSwapRepository(ctx: {
  getSwapDelegationInfo: (chainId?: UniverseChainId) => SwapDelegationInfo
}): EVMSwapRepository {
  return {
    fetchSwapData: async () => {
      throw new Error('Swap API is not used for HashKey chains. Transactions should be built from quote methodParameters.')
    },
  }
}

/**
 * HashKey chains (133, 177) do not use swap API.
 * This repository should never be called for HashKey chains.
 */
export function create5792EVMSwapRepository(): EVMSwapRepository {
  return {
    fetchSwapData: async () => {
      throw new Error('Swap API is not used for HashKey chains. Transactions should be built from quote methodParameters.')
    },
  }
}
