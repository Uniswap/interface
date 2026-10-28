import { renderHook } from '@testing-library/react'
import { DEFAULT_VERIFIED_AUCTION_IDS } from 'uniswap/src/features/toucan/auctionMetadata'
import { useVerifiedAuctionIds } from 'uniswap/src/features/toucan/useVerifiedAuctionIds'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the SDK under useDynamicConfigValue, not the hook itself, so the real default and type guard run.
const { mockConfigValue } = vi.hoisted(() => ({ mockConfigValue: { current: undefined as unknown } }))

vi.mock('@universe/gating/src/sdk/statsig', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating/src/sdk/statsig')>()),
  useDynamicConfig: () => ({
    get: (_key: string, fallback: unknown) => mockConfigValue.current ?? fallback,
  }),
}))

describe('useVerifiedAuctionIds', () => {
  beforeEach(() => {
    mockConfigValue.current = undefined
  })

  it('returns the Statsig list', () => {
    mockConfigValue.current = ['1_0x0000000000000000000000000000000000000001']

    const { result } = renderHook(() => useVerifiedAuctionIds())

    expect(result.current).toEqual(['1_0x0000000000000000000000000000000000000001'])
  })

  it('falls back to the default list when Statsig has no value', () => {
    const { result } = renderHook(() => useVerifiedAuctionIds())

    expect(result.current).toBe(DEFAULT_VERIFIED_AUCTION_IDS)
  })

  it.each([
    ['an object', { '1_0xabc': true }],
    ['a non-string entry', ['1_0xabc', 1]],
    ['a string', '1_0xabc'],
  ])('falls back to the default list when the config is %s', (_label, value) => {
    mockConfigValue.current = value

    const { result } = renderHook(() => useVerifiedAuctionIds())

    expect(result.current).toBe(DEFAULT_VERIFIED_AUCTION_IDS)
  })
})
