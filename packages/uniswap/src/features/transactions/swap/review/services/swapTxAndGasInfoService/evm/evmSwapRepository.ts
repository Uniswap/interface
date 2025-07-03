import { TransactionRequest } from '@ethersproject/providers'
import { fetchSwap, fetchSwap5792, fetchSwap7702 } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  CreateSwap5792Response,
  CreateSwap7702Response,
  CreateSwapRequest,
  CreateSwapResponse,
} from 'uniswap/src/data/tradingApi/__generated__'
import { GasEstimate } from 'uniswap/src/data/tradingApi/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'

export type SwapData = {
  requestId: string
  transactions: TransactionRequest[]
  gasFee?: string
  gasEstimates?: GasEstimate[]
  includesDelegation?: boolean
}
export interface EVMSwapRepository {
  fetchSwapData: (params: CreateSwapRequest) => Promise<SwapData>
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
    fetchSwapData: async (params: CreateSwapRequest) => convertSwapResponseToSwapData(await fetchSwap(params)),
  }
}

export function convertSwap7702ResponseToSwapData(
  response: CreateSwap7702Response,
  includesDelegation?: boolean,
): SwapData {
  return {
    requestId: response.requestId,
    transactions: [response.swap],
    gasFee: response.gasFee,
    includesDelegation,
  }
}

export function create7702EVMSwapRepository(ctx: {
  getSwapDelegationInfo: (chainId?: UniverseChainId) => SwapDelegationInfo
}): EVMSwapRepository {
  const { getSwapDelegationInfo } = ctx
  async function fetchSwapData(params: CreateSwapRequest): Promise<SwapData> {
    const chainId = tradingApiToUniverseChainId(params.quote.chainId)
    const smartContractDelegationInfo = getSwapDelegationInfo(chainId)
    const response = await fetchSwap7702({
      ...params,
      smartContractDelegationAddress: smartContractDelegationInfo.delegationAddress,
    })

    return convertSwap7702ResponseToSwapData(response, smartContractDelegationInfo.delegationInclusion)
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
    fetchSwapData: async (params: CreateSwapRequest) => convertSwap5792ResponseToSwapData(await fetchSwap5792(params)),
  }
}
