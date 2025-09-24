import { TransactionRequest } from '@ethersproject/providers'
import { GasEstimate, TradingApi } from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'

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

export function convertSwapResponseToSwapData(response: TradingApi.CreateSwapResponse): SwapData {
  return {
    requestId: response.requestId,
    transactions: [response.swap],
    gasFee: response.gasFee,
    gasEstimate: response.gasEstimates?.[0],
  }
}

export function createLegacyEVMSwapRepository(): EVMSwapRepository {
  return {
    fetchSwapData: async (params: TradingApi.CreateSwapRequest) =>
      convertSwapResponseToSwapData(await TradingApiClient.fetchSwap(params)),
  }
}

export function convertSwap7702ResponseToSwapData(
  response: TradingApi.CreateSwap7702Response,
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
  async function fetchSwapData(params: TradingApi.CreateSwapRequest): Promise<SwapData> {
    const chainId = tradingApiToUniverseChainId(params.quote.chainId)
    const smartContractDelegationInfo = getSwapDelegationInfo(chainId)
    const response = await TradingApiClient.fetchSwap7702({
      ...params,
      smartContractDelegationAddress: smartContractDelegationInfo.delegationAddress,
    })

    return convertSwap7702ResponseToSwapData(response, smartContractDelegationInfo.delegationInclusion)
  }

  return { fetchSwapData }
}

export function convertSwap5792ResponseToSwapData(response: TradingApi.CreateSwap5792Response): SwapData {
  return {
    requestId: response.requestId,
    transactions: response.calls.map((c) => ({ ...c, chainId: response.chainId })),
    gasFee: response.gasFee,
  }
}

export function create5792EVMSwapRepository(): EVMSwapRepository {
  return {
    fetchSwapData: async (params: TradingApi.CreateSwapRequest) =>
      convertSwap5792ResponseToSwapData(await TradingApiClient.fetchSwap5792(params)),
  }
}
