import io from 'socket.io-client'
import { config } from 'src/config'
import { Namespace, RequestBody, Scope } from 'src/features/dataApi/zerion/types'

const BASE_URL = 'wss://api-v4.zerion.io/'
export type ACTION_TYPE = 'get' | 'subscribe'

export const requests = {
  [Namespace.Address]: {
    transactions: (
      addresses: string[],
      actionType?: ACTION_TYPE,
      currency = 'usd'
    ): { requestBodies: Array<RequestBody>; actionType?: ACTION_TYPE } => ({
      actionType,
      requestBodies: addresses.map((address) => ({
        scope: [Scope.Transactions],
        payload: {
          address,
          currency,
        },
      })),
    }),
  },
  [Namespace.Assets]: {
    info: ({
      asset_codes = [],
      chain = 'ethereum',
      currency = 'usd',
      limit = 30,
      order_by = { market_cap: 'desc' },
    }: {
      asset_codes: string[]
      chain?: string
      currency?: string
      limit?: number
      order_by?: any
    }): { requestBody: RequestBody } => ({
      requestBody: {
        scope: [Scope.Info],
        payload: {
          asset_codes,
          chain,
          currency,
          limit,
          order_by,
        },
      },
    }),
    market: ({
      category_id = 'market',
      chain = 'ethereum',
      currency = 'usd',
      limit = 30,
      order_by = { market_cap: 'desc' },
    }: {
      category_id?: string
      chain?: string
      currency?: string
      limit?: number
      order_by?: any
    }): { requestBody: RequestBody } => ({
      requestBody: {
        scope: [Scope.Info],
        payload: {
          category_id,
          chain,
          currency,
          limit,
          order_by,
        },
      },
    }),
    search: ({
      category_id = 'market',
      chain = '',
      currency = 'usd',
      limit = 10,
      order_by = { market_cap: 'desc' },
      search_query,
    }: {
      category_id?: string
      chain?: string
      currency?: string
      limit?: number
      order_by?: any
      search_query: string
    }): { requestBody: RequestBody } => ({
      requestBody: {
        scope: [Scope.Info],
        payload: {
          category_id,
          chain,
          currency,
          limit,
          order_by,
          search_query,
        },
      },
    }),
  },
}

export async function initSocket<T>(
  namespace: Namespace,
  requestBody: RequestBody,
  cacheDataLoaded: Promise<unknown>,
  cacheEntryRemoved: Promise<unknown>,
  handleReceive: (data: T) => void,
  action: 'get' | 'subscribe' = 'get'
) {
  try {
    const { socket } = getSocket(namespace)
    const model = requestBody.scope[0]

    await cacheDataLoaded

    socket.emit(action, requestBody)
    socket.on(`received ${namespace} ${model}`, handleReceive)
    socket.on(`appended ${namespace} ${model}`, handleReceive)

    // cacheEntryRemoved will resolve when the cache subscription is no longer active
    await cacheEntryRemoved

    socket.off(`received ${namespace} ${model}`)
    socket.off(`appended ${namespace} ${model}`)
  } catch (e) {
    // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
    // in which case `cacheDataLoaded` will throw
  }
}

function getSocket(namespace: Namespace) {
  return {
    namespace,
    socket: io(`${BASE_URL}${namespace}`, {
      transports: ['websocket'],
      timeout: 60000,
      query: {
        api_token: config.zerionApiKey,
      },
    }),
  }
}
