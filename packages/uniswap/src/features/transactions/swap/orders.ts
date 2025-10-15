import { fetchOrders } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { GetOrdersResponse } from 'uniswap/src/data/tradingApi/__generated__/index'

export async function getOrders(orderIds: string[]): Promise<GetOrdersResponse> {
  return await fetchOrders({ orderIds })
}
