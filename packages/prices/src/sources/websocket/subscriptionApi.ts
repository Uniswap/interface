import type { FetchClient } from '@universe/api'
import type { TokenSubscriptionParams } from '@universe/prices/src/types'
import type { SubscriptionHandler } from '@universe/websocket'

const EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE = 'EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE'

export interface SubscriptionApiOptions {
  client: FetchClient
  onError?: (error: unknown, operation: string) => void
}

/**
 * Creates a subscription handler for token price subscriptions.
 * This implements the SubscriptionHandler interface from @universe/websocket.
 */
export function createPriceSubscriptionHandler(
  options: SubscriptionApiOptions,
): SubscriptionHandler<TokenSubscriptionParams> {
  const { client, onError } = options

  async function subscribe(connectionId: string, params: TokenSubscriptionParams): Promise<void> {
    try {
      await client.post('/uniswap.notificationservice.v1.EventSubscriptionService/Subscribe', {
        body: JSON.stringify({
          eventSubscriptionType: EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE,
          connectionId,
          events: [{ token: { chainId: params.chainId, tokenAddress: params.tokenAddress } }],
        }),
      })
    } catch (error) {
      onError?.(error, 'subscribe')
    }
  }

  async function unsubscribe(connectionId: string, params: TokenSubscriptionParams): Promise<void> {
    try {
      await client.post('/uniswap.notificationservice.v1.EventSubscriptionService/Unsubscribe', {
        body: JSON.stringify({
          eventSubscriptionType: EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE,
          connectionId,
          events: [{ token: { chainId: params.chainId, tokenAddress: params.tokenAddress } }],
        }),
      })
    } catch (error) {
      onError?.(error, 'unsubscribe')
    }
  }

  async function subscribeBatch(connectionId: string, paramsList: TokenSubscriptionParams[]): Promise<void> {
    if (paramsList.length === 0) {
      return
    }

    try {
      await client.post('/uniswap.notificationservice.v1.EventSubscriptionService/Subscribe', {
        body: JSON.stringify({
          eventSubscriptionType: EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE,
          connectionId,
          events: paramsList.map((p) => ({ token: { chainId: p.chainId, tokenAddress: p.tokenAddress } })),
        }),
      })
    } catch (error) {
      onError?.(error, 'subscribeBatch')
    }
  }

  async function unsubscribeBatch(connectionId: string, paramsList: TokenSubscriptionParams[]): Promise<void> {
    if (paramsList.length === 0) {
      return
    }

    try {
      await client.post('/uniswap.notificationservice.v1.EventSubscriptionService/Unsubscribe', {
        body: JSON.stringify({
          eventSubscriptionType: EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE,
          connectionId,
          events: paramsList.map((p) => ({ token: { chainId: p.chainId, tokenAddress: p.tokenAddress } })),
        }),
      })
    } catch (error) {
      onError?.(error, 'unsubscribeBatch')
    }
  }

  async function refreshSession(connectionId: string): Promise<void> {
    try {
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
