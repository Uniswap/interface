import { REALTIME_RATE_TOKEN_ADDRESS } from '@universe/prices/src/sources/websocket/realtimeJoiner'
import { withRealtimeRateSubscription } from '@universe/prices/src/sources/websocket/withRealtimeRateSubscription'
import type { TokenSubscriptionParams } from '@universe/prices/src/types'
import type { SubscriptionOptions, WebSocketClient } from '@universe/websocket'
import { describe, expect, it, vi } from 'vitest'

function createClientSpy(): {
  client: WebSocketClient<TokenSubscriptionParams, unknown>
  subscribed: TokenSubscriptionParams[]
  unsubscribed: TokenSubscriptionParams[]
} {
  const subscribed: TokenSubscriptionParams[] = []
  const unsubscribed: TokenSubscriptionParams[] = []
  const client: WebSocketClient<TokenSubscriptionParams, unknown> = {
    isConnected: () => true,
    getConnectionStatus: () => 'connected',
    getConnectionId: () => 'conn-1',
    subscribe: (options: SubscriptionOptions<TokenSubscriptionParams, unknown>) => {
      subscribed.push(options.params)
      return () => {
        unsubscribed.push(options.params)
      }
    },
    onStatusChange: vi.fn(() => () => {}),
    onConnectionEstablished: vi.fn(() => () => {}),
  }
  return { client, subscribed, unsubscribed }
}

describe('withRealtimeRateSubscription', () => {
  it('passes non-realtime-chain subscriptions through untouched', () => {
    const { client, subscribed, unsubscribed } = createClientSpy()
    const wrapped = withRealtimeRateSubscription(client, new Set([4663]))

    const unsubscribe = wrapped.subscribe({ channel: 'token_price', params: { chainId: 1, tokenAddress: '0xaaa' } })
    expect(subscribed).toEqual([{ chainId: 1, tokenAddress: '0xaaa' }])

    unsubscribe()
    expect(unsubscribed).toEqual([{ chainId: 1, tokenAddress: '0xaaa' }])
  })

  it('adds a rate-room subscription alongside realtime-chain tokens and releases both', () => {
    const { client, subscribed, unsubscribed } = createClientSpy()
    const wrapped = withRealtimeRateSubscription(client, new Set([4663]))

    const unsubscribe = wrapped.subscribe({ channel: 'token_price', params: { chainId: 4663, tokenAddress: '0xbbb' } })
    expect(subscribed).toEqual([
      { chainId: 4663, tokenAddress: '0xbbb' },
      { chainId: 4663, tokenAddress: REALTIME_RATE_TOKEN_ADDRESS },
    ])

    unsubscribe()
    expect(unsubscribed).toEqual([
      { chainId: 4663, tokenAddress: '0xbbb' },
      { chainId: 4663, tokenAddress: REALTIME_RATE_TOKEN_ADDRESS },
    ])
  })

  it('holds no rate room for pool-routed tokens, even on realtime chains', () => {
    const { client, subscribed } = createClientSpy()
    const wrapped = withRealtimeRateSubscription(client, new Set([4663]))

    const params = {
      chainId: 4663,
      tokenAddress: '0xbbb',
      poolRoute: { protocolVersion: 'v4' as const, poolId: '0x' + 'ab'.repeat(32) },
    }
    wrapped.subscribe({ channel: 'token_price', params })
    expect(subscribed).toEqual([params])
  })

  it('does not recurse when the rate room itself is subscribed', () => {
    const { client, subscribed } = createClientSpy()
    const wrapped = withRealtimeRateSubscription(client, new Set([4663]))

    wrapped.subscribe({ channel: 'token_price', params: { chainId: 4663, tokenAddress: REALTIME_RATE_TOKEN_ADDRESS } })
    expect(subscribed).toEqual([{ chainId: 4663, tokenAddress: REALTIME_RATE_TOKEN_ADDRESS }])
  })
})
