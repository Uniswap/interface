import { REALTIME_RATE_TOKEN_ADDRESS } from '@universe/prices/src/sources/websocket/realtimeJoiner'
import type { TokenSubscriptionParams } from '@universe/prices/src/types'
import type { WebSocketClient } from '@universe/websocket'

/**
 * Decorates a price ws client so every subscription to a realtime-chain token
 * also holds a reference on that chain's zero-address ETH/USD rate room. The
 * underlying SubscriptionManager provides the ref-counting, batching, and
 * resubscribe-on-reconnect, so the rate room lives exactly as long as at
 * least one realtime token subscription does.
 */
export function withRealtimeRateSubscription<TMessage>(
  client: WebSocketClient<TokenSubscriptionParams, TMessage>,
  realtimeChainIds: ReadonlySet<number>,
): WebSocketClient<TokenSubscriptionParams, TMessage> {
  return {
    ...client,
    subscribe: (options) => {
      const unsubscribe = client.subscribe(options)
      const { chainId, tokenAddress, poolRoute } = options.params
      // Pool-routed tokens don't ride the realtime channel, so they hold no rate room.
      if (poolRoute || !realtimeChainIds.has(chainId) || tokenAddress.toLowerCase() === REALTIME_RATE_TOKEN_ADDRESS) {
        return unsubscribe
      }
      const unsubscribeRate = client.subscribe({
        channel: options.channel,
        params: { chainId, tokenAddress: REALTIME_RATE_TOKEN_ADDRESS },
      })
      return () => {
        unsubscribe()
        unsubscribeRate()
      }
    },
  }
}
