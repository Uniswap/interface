import { createPoolPriceJoiner } from '@universe/prices/src/sources/websocket/poolPriceJoiner'
import { describe, expect, it } from 'vitest'

const CHAIN_ID = 4663
const NATIVE = '0x0000000000000000000000000000000000000000'
const LAUNCHER = '0xaaaa000000000000000000000000000000000001'
const POOL_ID = '0x' + 'ab'.repeat(32)
const BLOCK_TS = '2026-07-27T12:00:00.000Z'
const BLOCK_TS_MS = new Date(BLOCK_TS).getTime()

function poolMessage(overrides: {
  chainId?: number
  protocolVersion?: string
  poolId?: string
  token0Address?: string
  token1Address?: string
  priceToken0InToken1?: string
  priceToken1InToken0?: string
  quoteTokenAddress?: string
  version: string
  timestamp?: string
}): unknown {
  return {
    type: 'pool_price_update',
    payload: {
      chainId: overrides.chainId ?? CHAIN_ID,
      protocolVersion: overrides.protocolVersion ?? 'v4',
      poolId: overrides.poolId ?? POOL_ID,
      // Launcher pools: native (currency0 on v4) vs the launcher token.
      token0Address: overrides.token0Address ?? NATIVE,
      token1Address: overrides.token1Address ?? LAUNCHER,
      priceToken0InToken1: overrides.priceToken0InToken1 ?? '',
      priceToken1InToken0: overrides.priceToken1InToken0 ?? '',
      quoteTokenAddress: overrides.quoteTokenAddress ?? NATIVE,
      version: overrides.version,
      timestamp: overrides.timestamp ?? BLOCK_TS,
    },
    timestamp: '2026-07-27T12:00:01.000Z',
  }
}

describe('createPoolPriceJoiner', () => {
  it('ignores non-pool messages', () => {
    const joiner = createPoolPriceJoiner()
    expect(joiner.handleMessage({ type: 'token_price_realtime_update', payload: {} })).toEqual([])
    expect(joiner.handleMessage(null)).toEqual([])
    expect(joiner.handleMessage('nope')).toEqual([])
  })

  it('holds a tick until the quote USD rate arrives, then setQuoteUsd emits the join', () => {
    const joiner = createPoolPriceJoiner()
    const held = joiner.handleMessage(poolMessage({ priceToken1InToken0: '0.002', version: '1000000' }))
    expect(held).toEqual([])
    expect(joiner.getPendingQuotes()).toEqual([{ chainId: CHAIN_ID, quoteTokenAddress: NATIVE }])

    const updates = joiner.setQuoteUsd({
      chainId: CHAIN_ID,
      quoteTokenAddress: NATIVE,
      priceUsd: 3000,
      timestamp: BLOCK_TS_MS + 5_000,
    })
    expect(updates).toEqual([
      {
        chainId: CHAIN_ID,
        tokenAddress: LAUNCHER,
        priceUsd: 6,
        priceInQuote: 0.002,
        quoteTokenAddress: NATIVE,
        timestamp: BLOCK_TS_MS + 5_000,
      },
    ])
    expect(joiner.getPendingQuotes()).toEqual([])
  })

  it('emits immediately once the rate is known, stamped with the payload block time', () => {
    const joiner = createPoolPriceJoiner()
    joiner.setQuoteUsd({ chainId: CHAIN_ID, quoteTokenAddress: NATIVE, priceUsd: 3000, timestamp: BLOCK_TS_MS })
    const updates = joiner.handleMessage(poolMessage({ priceToken1InToken0: '0.002', version: '1000000' }))
    expect(updates).toEqual([
      {
        chainId: CHAIN_ID,
        tokenAddress: LAUNCHER,
        priceUsd: 6,
        priceInQuote: 0.002,
        quoteTokenAddress: NATIVE,
        timestamp: BLOCK_TS_MS,
      },
    ])
  })

  it('picks the base-in-quote orientation for either pool side', () => {
    const joiner = createPoolPriceJoiner()
    joiner.setQuoteUsd({ chainId: CHAIN_ID, quoteTokenAddress: NATIVE, priceUsd: 2000, timestamp: BLOCK_TS_MS })

    // Quote is token1 → base is token0 → price token0-in-token1.
    const baseIsToken0 = joiner.handleMessage(
      poolMessage({
        token0Address: LAUNCHER,
        token1Address: NATIVE,
        priceToken0InToken1: '0.004',
        priceToken1InToken0: '250',
        version: '1000000',
      }),
    )
    expect(baseIsToken0).toEqual([
      {
        chainId: CHAIN_ID,
        tokenAddress: LAUNCHER,
        priceUsd: 8,
        priceInQuote: 0.004,
        quoteTokenAddress: NATIVE,
        timestamp: BLOCK_TS_MS,
      },
    ])

    // Quote is token0 → base is token1 → price token1-in-token0.
    const baseIsToken1 = joiner.handleMessage(
      poolMessage({
        poolId: '0x' + 'cd'.repeat(32),
        token0Address: NATIVE,
        token1Address: LAUNCHER,
        priceToken0InToken1: '250',
        priceToken1InToken0: '0.004',
        version: '1000000',
      }),
    )
    expect(baseIsToken1[0]?.priceInQuote).toBe(0.004)
    expect(baseIsToken1[0]?.tokenAddress).toBe(LAUNCHER)
  })

  it('drops ticks whose version does not increase for the room (BigInt-safe)', () => {
    const joiner = createPoolPriceJoiner()
    joiner.setQuoteUsd({ chainId: CHAIN_ID, quoteTokenAddress: NATIVE, priceUsd: 3000, timestamp: BLOCK_TS_MS })
    // Exceeds 2^53 — Number() would corrupt ordering here.
    const big = '18014398509481984000001'
    expect(joiner.handleMessage(poolMessage({ priceToken1InToken0: '0.002', version: big }))).toHaveLength(1)
    expect(joiner.handleMessage(poolMessage({ priceToken1InToken0: '0.003', version: big }))).toEqual([])
    expect(
      joiner.handleMessage(poolMessage({ priceToken1InToken0: '0.003', version: '18014398509481984000000' })),
    ).toEqual([])
    expect(
      joiner.handleMessage(poolMessage({ priceToken1InToken0: '0.003', version: '18014398509481984000002' })),
    ).toHaveLength(1)
  })

  it('scopes version floors per room, not per token', () => {
    const joiner = createPoolPriceJoiner()
    joiner.setQuoteUsd({ chainId: CHAIN_ID, quoteTokenAddress: NATIVE, priceUsd: 3000, timestamp: BLOCK_TS_MS })
    expect(joiner.handleMessage(poolMessage({ priceToken1InToken0: '0.002', version: '2000000' }))).toHaveLength(1)
    // Same version on a different pool room still passes.
    expect(
      joiner.handleMessage(
        poolMessage({ poolId: '0x' + 'cd'.repeat(32), priceToken1InToken0: '0.005', version: '2000000' }),
      ),
    ).toHaveLength(1)
  })

  it('never emits pools with no pinned quote', () => {
    const joiner = createPoolPriceJoiner()
    const updates = joiner.handleMessage(
      poolMessage({
        quoteTokenAddress: '',
        priceToken1InToken0: '0.002',
        priceToken0InToken1: '500',
        version: '1000000',
      }),
    )
    expect(updates).toEqual([])
    expect(joiner.getPendingQuotes()).toEqual([])
  })

  it('drops ticks whose quote is not a side of the pool', () => {
    const joiner = createPoolPriceJoiner()
    const updates = joiner.handleMessage(
      poolMessage({
        quoteTokenAddress: '0x9999000000000000000000000000000000000009',
        priceToken1InToken0: '0.002',
        version: '1000000',
      }),
    )
    expect(updates).toEqual([])
  })

  it('re-emits the latest leg per room on each rate refresh, advancing the timestamp', () => {
    const joiner = createPoolPriceJoiner()
    joiner.handleMessage(poolMessage({ priceToken1InToken0: '0.002', version: '1000000' }))
    joiner.handleMessage(poolMessage({ priceToken1InToken0: '0.003', version: '2000000' }))

    const updates = joiner.setQuoteUsd({
      chainId: CHAIN_ID,
      quoteTokenAddress: NATIVE,
      priceUsd: 1000,
      timestamp: BLOCK_TS_MS + 30_000,
    })
    expect(updates).toEqual([
      {
        chainId: CHAIN_ID,
        tokenAddress: LAUNCHER,
        priceUsd: 3,
        priceInQuote: 0.003,
        quoteTokenAddress: NATIVE,
        timestamp: BLOCK_TS_MS + 30_000,
      },
    ])
  })

  it('scopes rate joins to the quote token and chain', () => {
    const joiner = createPoolPriceJoiner()
    joiner.handleMessage(poolMessage({ priceToken1InToken0: '0.002', version: '1000000' }))
    // Different chain: no join.
    expect(
      joiner.setQuoteUsd({ chainId: 1, quoteTokenAddress: NATIVE, priceUsd: 3000, timestamp: BLOCK_TS_MS }),
    ).toEqual([])
    // Different quote token on the right chain: no join.
    expect(
      joiner.setQuoteUsd({
        chainId: CHAIN_ID,
        quoteTokenAddress: '0x9999000000000000000000000000000000000009',
        priceUsd: 1,
        timestamp: BLOCK_TS_MS,
      }),
    ).toEqual([])
  })

  it('rejects malformed prices, rates, and versions', () => {
    const joiner = createPoolPriceJoiner()
    joiner.setQuoteUsd({ chainId: CHAIN_ID, quoteTokenAddress: NATIVE, priceUsd: 3000, timestamp: BLOCK_TS_MS })
    expect(joiner.handleMessage(poolMessage({ priceToken1InToken0: '', version: '1000000' }))).toEqual([])
    expect(joiner.handleMessage(poolMessage({ priceToken1InToken0: '-1', version: '1000001' }))).toEqual([])
    expect(joiner.handleMessage(poolMessage({ priceToken1InToken0: 'abc', version: '1000002' }))).toEqual([])
    expect(joiner.handleMessage(poolMessage({ priceToken1InToken0: '0.002', version: 'not-a-version' }))).toEqual([])
    expect(joiner.handleMessage(poolMessage({ priceToken1InToken0: '0.002', version: '0' }))).toEqual([])
    expect(
      joiner.setQuoteUsd({ chainId: CHAIN_ID, quoteTokenAddress: NATIVE, priceUsd: NaN, timestamp: BLOCK_TS_MS }),
    ).toEqual([])
    expect(
      joiner.setQuoteUsd({ chainId: CHAIN_ID, quoteTokenAddress: NATIVE, priceUsd: -5, timestamp: BLOCK_TS_MS }),
    ).toEqual([])
  })

  it('falls back to the envelope timestamp, then receipt time, for unparseable stamps', () => {
    const joiner = createPoolPriceJoiner()
    joiner.setQuoteUsd({ chainId: CHAIN_ID, quoteTokenAddress: NATIVE, priceUsd: 3000, timestamp: BLOCK_TS_MS })
    const before = Date.now()
    const updates = joiner.handleMessage(
      poolMessage({ priceToken1InToken0: '0.002', version: '1000000', timestamp: 'garbage' }),
    )
    expect(updates).toHaveLength(1)
    expect(updates[0]!.timestamp).toBeGreaterThanOrEqual(before)
  })
})
