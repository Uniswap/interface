import { TradingApi } from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'

export async function getOrders(orderIds: string[]): Promise<TradingApi.GetOrdersResponse> {
  return await TradingApiClient.fetchOrders({ orderIds })
}
