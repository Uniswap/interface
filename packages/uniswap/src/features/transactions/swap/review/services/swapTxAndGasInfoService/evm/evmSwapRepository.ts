import { TransactionRequest } from '@ethersproject/providers'
import {
  WithV4Flag,
  fetchSwap,
  fetchSwap5792,
  fetchSwap7702,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  CreateSwap5792Response,
  CreateSwapRequest,
  CreateSwapResponse,
} from 'uniswap/src/data/tradingApi/__generated__'
import { GasEstimate } from 'uniswap/src/data/tradingApi/types'

export type SwapData = {
  requestId: string
  transactions: TransactionRequest[]
  gasFee?: string
  gasEstimates?: GasEstimate[]
}
export interface EVMSwapRepository {
  fetchSwapData: (params: WithV4Flag<CreateSwapRequest>) => Promise<SwapData>
}

export function createEVMSwapRepository(ctx: { swapDelegationAddress: string | undefined }): EVMSwapRepository {
  const { swapDelegationAddress } = ctx
  return swapDelegationAddress
    ? create7702EVMSwapRepository({ swapDelegationAddress })
    : createLegacyEVMSwapRepository()
}

export function convertSwapResponseToSwapData(response: CreateSwapResponse): SwapData {
  return {
    requestId: response.requestId,
    transactions: [response.swap],
    gasFee: response.gasFee,
    gasEstimates: response.gasEstimates,
  }
}

export function createLegacyEVMSwapRepository(): EVMSwapRepository {
  return {
    fetchSwapData: async (params: WithV4Flag<CreateSwapRequest>) =>
      convertSwapResponseToSwapData(await fetchSwap(params)),
  }
}

export function create7702EVMSwapRepository(ctx: { swapDelegationAddress: string }): EVMSwapRepository {
  const { swapDelegationAddress } = ctx
  async function fetchSwapData(params: WithV4Flag<CreateSwapRequest>): Promise<SwapData> {
    const response = await fetchSwap7702({ ...params, smartContractDelegationAddress: swapDelegationAddress })
    return {
      requestId: response.requestId,
      transactions: [response.swap],
      gasFee: response.gasFee,
    }
  }

  return { fetchSwapData }
}

export function convertSwap5792ResponseToSwapData(response: CreateSwap5792Response): SwapData {
  return {
    requestId: response.requestId,
    transactions: response.calls.map((c) => ({ ...c, chainId: response.chainId })),
    gasFee: response.gasFee,
  }
}

export function create5792EVMSwapRepository(): EVMSwapRepository {
  return {
    fetchSwapData: async (params: WithV4Flag<CreateSwapRequest>) =>
      convertSwap5792ResponseToSwapData(await fetchSwap5792(params)),
  }
}
