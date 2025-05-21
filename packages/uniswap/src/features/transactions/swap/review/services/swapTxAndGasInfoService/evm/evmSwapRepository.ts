import { TransactionRequest } from '@ethersproject/providers'
import {
  WithV4Flag,
  fetchSwap,
  fetchSwap5792,
  fetchSwap7702,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  CreateSwap5792Response,
  CreateSwap7702Response,
  CreateSwapRequest,
  CreateSwapResponse,
} from 'uniswap/src/data/tradingApi/__generated__'
import { GasEstimate } from 'uniswap/src/data/tradingApi/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'

export type SwapData = {
  requestId: string
  transactions: TransactionRequest[]
  gasFee?: string
  gasEstimates?: GasEstimate[]
}
export interface EVMSwapRepository {
  fetchSwapData: (params: WithV4Flag<CreateSwapRequest>) => Promise<SwapData>
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

export function convertSwap7702ResponseToSwapData(response: CreateSwap7702Response): SwapData {
  return {
    requestId: response.requestId,
    transactions: [response.swap],
    gasFee: response.gasFee,
  }
}

export function create7702EVMSwapRepository(ctx: {
  getSwapDelegationAddress: (chainId?: UniverseChainId) => string | undefined
}): EVMSwapRepository {
  const { getSwapDelegationAddress } = ctx
  async function fetchSwapData(params: WithV4Flag<CreateSwapRequest>): Promise<SwapData> {
    const chainId = tradingApiToUniverseChainId(params.quote.chainId)
    const smartContractDelegationAddress = getSwapDelegationAddress(chainId)
    const response = await fetchSwap7702({ ...params, smartContractDelegationAddress })

    return convertSwap7702ResponseToSwapData(response)
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
