import {
  createRealtimePriceJoiner,
  REALTIME_RATE_TOKEN_ADDRESS,
} from '@universe/prices/src/sources/websocket/realtimeJoiner'
import { describe, expect, it } from 'vitest'

const CHAIN_ID = 4663
const TOKEN = '0xAaAa000000000000000000000000000000000001'
const TOKEN_LOWER = TOKEN.toLowerCase()
const TIMESTAMP = '2026-07-18T12:00:00.000Z'
const TIMESTAMP_MS = new Date(TIMESTAMP).getTime()

function realtimeMessage(payload: {
  chainId?: number
  tokenAddress: string
  priceUsd?: string
  priceEth?: string
  version: string
  timestamp?: string
}): unknown {
  return {
    type: 'token_price_realtime_update',
    payload: {
      chainId: payload.chainId ?? CHAIN_ID,
      tokenAddress: payload.tokenAddress,
      priceUsd: payload.priceUsd ?? '',
      priceEth: payload.priceEth ?? '',
      version: payload.version,
      feed: 'realtime',
    },
    timestamp: payload.timestamp ?? TIMESTAMP,
  }
}

function rateTick(priceUsd: string, version: string, chainId = CHAIN_ID): unknown {
  return realtimeMessage({ chainId, tokenAddress: REALTIME_RATE_TOKEN_ADDRESS, priceUsd, version })
}

describe('createRealtimePriceJoiner', () => {
  it('ignores non-realtime messages', () => {
    const joiner = createRealtimePriceJoiner()
    expect(joiner.handleMessage({ type: 'token_price_update', payload: {} })).toEqual([])
    expect(joiner.handleMessage(null)).toEqual([])
    expect(joiner.handleMessage('nope')).toEqual([])
  })

  it('emits USD-leg tokens directly without a rate', () => {
    const joiner = createRealtimePriceJoiner()
    const updates = joiner.handleMessage(realtimeMessage({ tokenAddress: TOKEN, priceUsd: '1.25', version: '1000000' }))
    expect(updates).toEqual([
      { chainId: CHAIN_ID, tokenAddress: TOKEN_LOWER, priceUsd: 1.25, priceEth: undefined, timestamp: TIMESTAMP_MS },
    ])
  })

  it('holds an ETH leg until the first rate tick, then emits the join', () => {
    const joiner = createRealtimePriceJoiner()
    const held = joiner.handleMessage(realtimeMessage({ tokenAddress: TOKEN, priceEth: '0.002', version: '1000000' }))
    expect(held).toEqual([])

    const updates = joiner.handleMessage(rateTick('3000', '2000000'))
    expect(updates).toEqual([
      { chainId: CHAIN_ID, tokenAddress: TOKEN_LOWER, priceUsd: 6, priceEth: 0.002, timestamp: TIMESTAMP_MS },
    ])
  })

  it('joins ETH legs immediately once the rate is known', () => {
    const joiner = createRealtimePriceJoiner()
    joiner.handleMessage(rateTick('3000', '1000000'))
    const updates = joiner.handleMessage(
      realtimeMessage({ tokenAddress: TOKEN, priceEth: '0.002', version: '1000001' }),
    )
    expect(updates).toEqual([
      { chainId: CHAIN_ID, tokenAddress: TOKEN_LOWER, priceUsd: 6, priceEth: 0.002, timestamp: TIMESTAMP_MS },
    ])
  })

  it('re-emits every held leg on each new rate tick', () => {
    const joiner = createRealtimePriceJoiner()
    const otherToken = '0xbbbb000000000000000000000000000000000002'
    joiner.handleMessage(rateTick('3000', '1000000'))
    joiner.handleMessage(realtimeMessage({ tokenAddress: TOKEN, priceEth: '0.002', version: '1000001' }))
    joiner.handleMessage(realtimeMessage({ tokenAddress: otherToken, priceEth: '0.5', version: '1000002' }))

    const updates = joiner.handleMessage(rateTick('4000', '2000000'))
    expect(updates).toHaveLength(2)
    expect(updates).toContainEqual({
      chainId: CHAIN_ID,
      tokenAddress: TOKEN_LOWER,
      priceUsd: 8,
      priceEth: 0.002,
      timestamp: TIMESTAMP_MS,
    })
    expect(updates).toContainEqual({
      chainId: CHAIN_ID,
      tokenAddress: otherToken,
      priceUsd: 2000,
      priceEth: 0.5,
      timestamp: TIMESTAMP_MS,
    })
  })

  it('never emits the zero-address rate as a token price', () => {
    const joiner = createRealtimePriceJoiner()
    expect(joiner.handleMessage(rateTick('3000', '1000000'))).toEqual([])
  })

  it('drops non-increasing versions per token (redelivery gate)', () => {
    const joiner = createRealtimePriceJoiner()
    joiner.handleMessage(realtimeMessage({ tokenAddress: TOKEN, priceUsd: '1', version: '5000000' }))
    // Exact redelivery
    expect(joiner.handleMessage(realtimeMessage({ tokenAddress: TOKEN, priceUsd: '2', version: '5000000' }))).toEqual(
      [],
    )
    // Out-of-order older message
    expect(joiner.handleMessage(realtimeMessage({ tokenAddress: TOKEN, priceUsd: '2', version: '4999999' }))).toEqual(
      [],
    )
    // Newer version passes
    expect(
      joiner.handleMessage(realtimeMessage({ tokenAddress: TOKEN, priceUsd: '2', version: '5000001' })),
    ).toHaveLength(1)
  })

  it('gates versions independently per token and handles values beyond 2^53', () => {
    const joiner = createRealtimePriceJoiner()
    const big = '9007199254740993000001' // > Number.MAX_SAFE_INTEGER; distinguishable only via BigInt
    const bigMinusOne = '9007199254740993000000'
    joiner.handleMessage(realtimeMessage({ tokenAddress: TOKEN, priceUsd: '1', version: big }))
    expect(joiner.handleMessage(realtimeMessage({ tokenAddress: TOKEN, priceUsd: '2', version: bigMinusOne }))).toEqual(
      [],
    )
    // Other token has its own floor
    const other = '0xbbbb000000000000000000000000000000000002'
    expect(
      joiner.handleMessage(realtimeMessage({ tokenAddress: other, priceUsd: '1', version: '1000000' })),
    ).toHaveLength(1)
  })

  it('gates the rate room by version too', () => {
    const joiner = createRealtimePriceJoiner()
    joiner.handleMessage(rateTick('3000', '2000000'))
    joiner.handleMessage(realtimeMessage({ tokenAddress: TOKEN, priceEth: '1', version: '1000000' }))
    // Stale rate redelivery must not re-emit held legs at the old rate
    expect(joiner.handleMessage(rateTick('2500', '1999999'))).toEqual([])
  })

  it('keeps rates and held legs scoped per chain', () => {
    const joiner = createRealtimePriceJoiner()
    joiner.handleMessage(rateTick('3000', '1000000', CHAIN_ID))
    // Same-address token on another chain: no rate there yet, so it holds
    const updates = joiner.handleMessage(
      realtimeMessage({ chainId: 999, tokenAddress: TOKEN, priceEth: '0.002', version: '1000000' }),
    )
    expect(updates).toEqual([])
    // The other chain's rate tick only joins its own tokens
    const joined = joiner.handleMessage(rateTick('100', '1000001', 999))
    expect(joined).toEqual([
      { chainId: 999, tokenAddress: TOKEN_LOWER, priceUsd: 0.2, priceEth: 0.002, timestamp: TIMESTAMP_MS },
    ])
  })

  it('falls back to receipt time when the envelope timestamp is unparseable', () => {
    const joiner = createRealtimePriceJoiner()
    const before = Date.now()
    const updates = joiner.handleMessage(
      realtimeMessage({ tokenAddress: TOKEN, priceUsd: '1.25', version: '1000000', timestamp: 'not-a-date' }),
    )
    expect(updates).toHaveLength(1)
    expect(updates[0]?.timestamp).toBeGreaterThanOrEqual(before)
    expect(Number.isFinite(updates[0]?.timestamp)).toBe(true)
  })

  it('drops messages with malformed versions or absent legs', () => {
    const joiner = createRealtimePriceJoiner()
    expect(
      joiner.handleMessage(realtimeMessage({ tokenAddress: TOKEN, priceUsd: '1', version: 'not-a-number' })),
    ).toEqual([])
    // Both legs empty
    expect(joiner.handleMessage(realtimeMessage({ tokenAddress: TOKEN, version: '1000000' }))).toEqual([])
  })
})
