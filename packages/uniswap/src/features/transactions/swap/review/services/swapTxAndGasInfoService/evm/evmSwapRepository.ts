import { WithV4Flag, fetchSwap } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { CreateSwapRequest, CreateSwapResponse } from 'uniswap/src/data/tradingApi/__generated__'

export interface EVMSwapRepository {
  fetchSwapData: (params: WithV4Flag<CreateSwapRequest>) => Promise<CreateSwapResponse>
}

export function createEVMSwapRepository(): EVMSwapRepository {
  return { fetchSwapData: fetchSwap }
}
