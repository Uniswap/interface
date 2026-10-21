import { renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTokenLaunchedTradeAvailability } from '~/features/Toucan/Auction/Banners/TokenLaunched/useTokenLaunchedTradeAvailability'
import { useTokenPoolState } from '~/hooks/useTokenPoolState'
import type { TokenPoolState } from '~/types/tokenPool'

vi.mock('~/hooks/useTokenPoolState', () => ({ useTokenPoolState: vi.fn() }))

const REDEEMABLE = {
  chainId: UniverseChainId.Mainnet,
  realTokenAddress: '0x2222222222222222222222222222222222222222',
  isRedeemable: true,
  isGraduated: true,
  isTradeAvailableFromStatus: true,
  tradingRestrictedUntilTge: false,
  hasMarketPrice: false,
} as const

describe('useTokenLaunchedTradeAvailability', () => {
  beforeEach(() => {
    vi.mocked(useTokenPoolState)
      .mockReset()
      .mockReturnValue({ poolState: { status: 'loading' }, refetch: vi.fn() })
  })

  it.each<{
    poolState: TokenPoolState
    isTradeAvailable: boolean
    loading: boolean
  }>([
    { poolState: { status: 'loading' }, isTradeAvailable: false, loading: true },
    { poolState: { status: 'error' }, isTradeAvailable: false, loading: false },
    { poolState: { status: 'success', poolCount: 0 }, isTradeAvailable: false, loading: false },
    { poolState: { status: 'success', poolCount: 7 }, isTradeAvailable: true, loading: false },
    // Shared with the auction display state: a count that is not a whole number of pools is a bad read.
    { poolState: { status: 'success', poolCount: 1.5 }, isTradeAvailable: false, loading: false },
    { poolState: { status: 'success', poolCount: -1 }, isTradeAvailable: false, loading: false },
  ])('uses the underlying pool state when market price is zero: $poolState', ({ poolState, ...expected }) => {
    vi.mocked(useTokenPoolState).mockReturnValue({ poolState, refetch: vi.fn() })

    const { result } = renderHook(() => useTokenLaunchedTradeAvailability(REDEEMABLE))

    expect(result.current).toEqual(expected)
  })

  it.each([
    { isGraduated: false },
    { isTradeAvailableFromStatus: false },
    { tradingRestrictedUntilTge: true },
    { realTokenAddress: undefined },
    { chainId: undefined },
  ])('does not fetch or wait for pools when trading cannot proceed: %j', (overrides) => {
    const { result } = renderHook(() => useTokenLaunchedTradeAvailability({ ...REDEEMABLE, ...overrides }))

    expect(result.current).toEqual({ isTradeAvailable: false, loading: false })
    expect(useTokenPoolState).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it.each([
    { isTradeAvailableFromStatus: true, hasMarketPrice: true, isTradeAvailable: true },
    { isTradeAvailableFromStatus: true, hasMarketPrice: false, isTradeAvailable: false },
    { isTradeAvailableFromStatus: false, hasMarketPrice: true, isTradeAvailable: false },
  ])('keeps the status and market-price gates for ordinary tokens: %j', ({ isTradeAvailable, ...overrides }) => {
    const { result } = renderHook(() =>
      useTokenLaunchedTradeAvailability({ ...REDEEMABLE, ...overrides, isRedeemable: false }),
    )

    expect(result.current).toEqual({ isTradeAvailable, loading: false })
    expect(useTokenPoolState).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})
