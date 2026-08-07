import type { FetchClient } from '@universe/api'
import type { TokenSubscriptionParams } from '@universe/prices/src/types'
import type { SubscriptionHandler } from '@universe/websocket'

const EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE = 'EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE'
const EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE_REALTIME = 'EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE_REALTIME'
const EVENT_SUBSCRIPTION_TYPE_POOL_PRICE = 'EVENT_SUBSCRIPTION_TYPE_POOL_PRICE'

type EventSubscriptionType =
  | typeof EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE
  | typeof EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE_REALTIME
  | typeof EVENT_SUBSCRIPTION_TYPE_POOL_PRICE

export interface SubscriptionApiOptions {
  client: FetchClient
  onError?: (error: unknown, operation: string) => void
  /**
   * Chains subscribed on the realtime channel (tokenRealtime event arm)
   * instead of the legacy USD channel. Injected by the app — the package
   * stays chain-agnostic. Params carrying a poolRoute bypass this and
   * subscribe the pool_price channel instead.
   */
  realtimeChainIds?: ReadonlySet<number>
}

/** The subscription RPC requires the event arm to match the subscription type. */
function toEvent(params: TokenSubscriptionParams, type: EventSubscriptionType): Record<string, unknown> {
  if (type === EVENT_SUBSCRIPTION_TYPE_POOL_PRICE && params.poolRoute) {
    return {
      pool: {
        chainId: params.chainId,
        protocolVersion: params.poolRoute.protocolVersion,
        poolId: params.poolRoute.poolId.toLowerCase(),
      },
    }
  }
  const token = { chainId: params.chainId, tokenAddress: params.tokenAddress }
  return type === EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE_REALTIME ? { tokenRealtime: token } : { token }
}

/**
 * Creates a subscription handler for token price subscriptions.
 * This implements the SubscriptionHandler interface from @universe/websocket.
 *
 * Params are routed per token to the pool_price channel (poolRoute set),
 * the realtime channel (realtimeChainIds), or the legacy channel; a mixed
 * batch fans out into one RPC per channel.
 */
export function createPriceSubscriptionHandler(
  options: SubscriptionApiOptions,
): SubscriptionHandler<TokenSubscriptionParams> {
  const { client, onError, realtimeChainIds } = options

  function typeFor(params: TokenSubscriptionParams): EventSubscriptionType {
    if (params.poolRoute) {
      return EVENT_SUBSCRIPTION_TYPE_POOL_PRICE
    }
    return realtimeChainIds?.has(params.chainId)
      ? EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE_REALTIME
      : EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE
  }

  async function callSubscriptionRpc(input: {
    method: 'Subscribe' | 'Unsubscribe'
    connectionId: string
    type: EventSubscriptionType
    paramsList: TokenSubscriptionParams[]
  }): Promise<void> {
    await client.post(`/uniswap.notificationservice.v1.EventSubscriptionService/${input.method}`, {
      body: JSON.stringify({
        eventSubscriptionType: input.type,
        connectionId: input.connectionId,
        events: input.paramsList.map((p) => toEvent(p, input.type)),
      }),
    })
  }

  async function callPerChannel(input: {
    method: 'Subscribe' | 'Unsubscribe'
    connectionId: string
    paramsList: TokenSubscriptionParams[]
    operation: string
  }): Promise<void> {
    const byType = new Map<EventSubscriptionType, TokenSubscriptionParams[]>()
    for (const params of input.paramsList) {
      const type = typeFor(params)
      const group = byType.get(type) ?? []
      group.push(params)
      byType.set(type, group)
    }
    try {
      await Promise.all(
        [...byType.entries()].map(([type, paramsList]) =>
          callSubscriptionRpc({ method: input.method, connectionId: input.connectionId, type, paramsList }),
        ),
      )
    } catch (error) {
      onError?.(error, input.operation)
    }
  }

  async function subscribe(connectionId: string, params: TokenSubscriptionParams): Promise<void> {
    await callPerChannel({ method: 'Subscribe', connectionId, paramsList: [params], operation: 'subscribe' })
  }

  async function unsubscribe(connectionId: string, params: TokenSubscriptionParams): Promise<void> {
    await callPerChannel({ method: 'Unsubscribe', connectionId, paramsList: [params], operation: 'unsubscribe' })
  }

  async function subscribeBatch(connectionId: string, paramsList: TokenSubscriptionParams[]): Promise<void> {
    if (paramsList.length === 0) {
      return
    }
    await callPerChannel({ method: 'Subscribe', connectionId, paramsList, operation: 'subscribeBatch' })
  }

  async function unsubscribeBatch(connectionId: string, paramsList: TokenSubscriptionParams[]): Promise<void> {
    if (paramsList.length === 0) {
      return
    }
    await callPerChannel({ method: 'Unsubscribe', connectionId, paramsList, operation: 'unsubscribeBatch' })
  }

  async function refreshSession(connectionId: string): Promise<void> {
    try {
      // The server refreshes the connection's entire forward index regardless
      // of the type sent — one call covers every channel, pool_price included.
      await client.post('/uniswap.notificationservice.v1.EventSubscriptionService/RefreshSession', {
        body: JSON.stringify({
          eventSubscriptionType: EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE,
          connectionId,
        }),
      })
    } catch (error) {
      onError?.(error, 'refreshSession')
    }
  }

  return {
    subscribe,
    unsubscribe,
    subscribeBatch,
    unsubscribeBatch,
    refreshSession,
  }
}
