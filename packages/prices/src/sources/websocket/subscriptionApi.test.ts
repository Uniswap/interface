import { FetchError, type FetchClient } from '@universe/api'
import { createPriceSubscriptionHandler } from '@universe/prices/src/sources/websocket/subscriptionApi'
import { ConnectionGoneError } from '@universe/websocket'
import { describe, expect, it, vi } from 'vitest'

const LEGACY_TYPE = 'EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE'
const REALTIME_TYPE = 'EVENT_SUBSCRIPTION_TYPE_TOKEN_PRICE_REALTIME'
const POOL_TYPE = 'EVENT_SUBSCRIPTION_TYPE_POOL_PRICE'
const CONNECTION_ID = 'conn-1'

const mainnetToken = { chainId: 1, tokenAddress: '0xaaa' }
const realtimeToken = { chainId: 4663, tokenAddress: '0xbbb' }
const POOL_ID = '0x' + 'AB'.repeat(32)
const POOL_ID_LOWERCASE = '0x' + 'ab'.repeat(32)
const poolRoutedToken = {
  chainId: 4663,
  tokenAddress: '0xccc',
  poolRoute: { protocolVersion: 'v4' as const, poolId: POOL_ID },
}

function createClient(): { client: FetchClient; calls: Array<{ path: string; body: Record<string, unknown> }> } {
  const calls: Array<{ path: string; body: Record<string, unknown> }> = []
  const post = vi.fn(async (path: string, options: { body?: unknown }) => {
    calls.push({ path, body: JSON.parse(String(options.body)) })
    return {}
  })
  return { client: { post } as unknown as FetchClient, calls }
}

function bodiesFor(calls: Array<{ path: string; body: Record<string, unknown> }>, method: string) {
  return calls.filter((c) => c.path.endsWith(`/${method}`)).map((c) => c.body)
}

describe('createPriceSubscriptionHandler channel routing', () => {
  it('uses the legacy channel and token arm when no realtime chains are configured', async () => {
    const { client, calls } = createClient()
    const handler = createPriceSubscriptionHandler({ client })
    await handler.subscribe(CONNECTION_ID, mainnetToken)

    expect(bodiesFor(calls, 'Subscribe')).toEqual([
      {
        eventSubscriptionType: LEGACY_TYPE,
        connectionId: CONNECTION_ID,
        events: [{ token: mainnetToken }],
      },
    ])
  })

  it('uses the realtime channel and tokenRealtime arm for realtime chains', async () => {
    const { client, calls } = createClient()
    const handler = createPriceSubscriptionHandler({ client, realtimeChainIds: new Set([4663]) })
    await handler.subscribe(CONNECTION_ID, realtimeToken)

    expect(bodiesFor(calls, 'Subscribe')).toEqual([
      {
        eventSubscriptionType: REALTIME_TYPE,
        connectionId: CONNECTION_ID,
        events: [{ tokenRealtime: realtimeToken }],
      },
    ])
  })

  it('fans a mixed batch out into one RPC per channel', async () => {
    const { client, calls } = createClient()
    const handler = createPriceSubscriptionHandler({ client, realtimeChainIds: new Set([4663]) })
    await handler.subscribeBatch?.(CONNECTION_ID, [mainnetToken, realtimeToken])

    const bodies = bodiesFor(calls, 'Subscribe')
    expect(bodies).toHaveLength(2)
    expect(bodies).toContainEqual({
      eventSubscriptionType: LEGACY_TYPE,
      connectionId: CONNECTION_ID,
      events: [{ token: mainnetToken }],
    })
    expect(bodies).toContainEqual({
      eventSubscriptionType: REALTIME_TYPE,
      connectionId: CONNECTION_ID,
      events: [{ tokenRealtime: realtimeToken }],
    })
  })

  it('routes unsubscribes the same way', async () => {
    const { client, calls } = createClient()
    const handler = createPriceSubscriptionHandler({ client, realtimeChainIds: new Set([4663]) })
    await handler.unsubscribe(CONNECTION_ID, realtimeToken)
    await handler.unsubscribeBatch?.(CONNECTION_ID, [mainnetToken, realtimeToken])

    const bodies = bodiesFor(calls, 'Unsubscribe')
    expect(bodies[0]).toEqual({
      eventSubscriptionType: REALTIME_TYPE,
      connectionId: CONNECTION_ID,
      events: [{ tokenRealtime: realtimeToken }],
    })
    expect(bodies).toHaveLength(3)
  })

  it('uses the pool channel and pool arm (lowercased id) for pool-routed params, beating the chain set', async () => {
    const { client, calls } = createClient()
    const handler = createPriceSubscriptionHandler({ client, realtimeChainIds: new Set([4663]) })
    await handler.subscribe(CONNECTION_ID, poolRoutedToken)

    expect(bodiesFor(calls, 'Subscribe')).toEqual([
      {
        eventSubscriptionType: POOL_TYPE,
        connectionId: CONNECTION_ID,
        events: [{ pool: { chainId: 4663, protocolVersion: 'v4', poolId: POOL_ID_LOWERCASE } }],
      },
    ])
  })

  it('fans a three-way batch into one RPC per channel', async () => {
    const { client, calls } = createClient()
    const handler = createPriceSubscriptionHandler({ client, realtimeChainIds: new Set([4663]) })
    await handler.subscribeBatch?.(CONNECTION_ID, [mainnetToken, realtimeToken, poolRoutedToken])

    const bodies = bodiesFor(calls, 'Subscribe')
    expect(bodies).toHaveLength(3)
    expect(bodies).toContainEqual({
      eventSubscriptionType: POOL_TYPE,
      connectionId: CONNECTION_ID,
      events: [{ pool: { chainId: 4663, protocolVersion: 'v4', poolId: POOL_ID_LOWERCASE } }],
    })
  })

  it('unsubscribes pool-routed params on the pool channel', async () => {
    const { client, calls } = createClient()
    const handler = createPriceSubscriptionHandler({ client })
    await handler.unsubscribe(CONNECTION_ID, poolRoutedToken)

    expect(bodiesFor(calls, 'Unsubscribe')).toEqual([
      {
        eventSubscriptionType: POOL_TYPE,
        connectionId: CONNECTION_ID,
        events: [{ pool: { chainId: 4663, protocolVersion: 'v4', poolId: POOL_ID_LOWERCASE } }],
      },
    ])
  })

  it('rejects on RPC failure so the websocket client can react', async () => {
    const post = vi.fn(async () => {
      throw new Error('boom')
    })
    const handler = createPriceSubscriptionHandler({ client: { post } as unknown as FetchClient })
    await expect(handler.subscribe(CONNECTION_ID, mainnetToken)).rejects.toThrow('boom')
    await expect(handler.refreshSession?.(CONNECTION_ID)).rejects.toThrow('boom')
  })

  it('skips the RPC entirely for empty batches', async () => {
    const { client, calls } = createClient()
    const handler = createPriceSubscriptionHandler({ client })
    await handler.subscribeBatch?.(CONNECTION_ID, [])
    await handler.unsubscribeBatch?.(CONNECTION_ID, [])
    expect(calls).toHaveLength(0)
  })
})

describe('expired connection ids', () => {
  function handlerFailingWith(error: unknown) {
    const post = vi.fn(async () => {
      throw error
    })
    return createPriceSubscriptionHandler({ client: { post } as unknown as FetchClient })
  }

  function fetchError(status: number, data?: unknown): FetchError {
    return new FetchError({ response: new Response(null, { status }), data })
  }

  it('rejects with ConnectionGoneError for the Connect NotFound on every RPC', async () => {
    const notFound = fetchError(404, { code: 'not_found', message: 'Connection not found' })
    const handler = handlerFailingWith(notFound)

    await expect(handler.refreshSession?.(CONNECTION_ID)).rejects.toMatchObject({
      name: 'ConnectionGoneError',
      connectionId: CONNECTION_ID,
      cause: notFound,
    })
    await expect(handler.subscribe(CONNECTION_ID, mainnetToken)).rejects.toBeInstanceOf(ConnectionGoneError)
    await expect(handler.unsubscribeBatch?.(CONNECTION_ID, [mainnetToken])).rejects.toBeInstanceOf(ConnectionGoneError)
  })

  it('passes other failures through unchanged', async () => {
    for (const error of [
      fetchError(404),
      fetchError(401, { code: 'unauthenticated' }),
      fetchError(500, { code: 'internal' }),
      new Error('Connection not found'),
    ]) {
      await expect(handlerFailingWith(error).refreshSession?.(CONNECTION_ID)).rejects.toBe(error)
    }
  })
})
