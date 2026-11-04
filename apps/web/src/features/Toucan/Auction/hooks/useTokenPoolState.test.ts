import { act, renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTokenPoolState } from '~/features/Toucan/Auction/hooks/useTokenPoolState'
import { useV2ListTokenPools } from '~/pages/Explore/hooks/useV2ListTokenPools'

vi.mock('~/pages/Explore/hooks/useV2ListTokenPools')

const mockUseV2ListTokenPools = vi.mocked(useV2ListTokenPools)
const mockRefetchPools = vi.fn()
const TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111'
const OTHER_TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222'
const DEFAULT_INPUT: Parameters<typeof useTokenPoolState>[0] = {
  chainId: UniverseChainId.Mainnet,
  tokenAddress: TOKEN_ADDRESS,
  enabled: true,
}

function mockPoolQuery(overrides: Partial<ReturnType<typeof useV2ListTokenPools>> = {}): void {
  mockUseV2ListTokenPools.mockReturnValue({
    pools: undefined,
    rawPoolCount: undefined,
    isLoading: true,
    isSuccess: false,
    isFetchedAfterMount: false,
    isError: false,
    refetch: mockRefetchPools,
    loadMore: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    ...overrides,
  })
}

function renderPoolState(overrides: Partial<Parameters<typeof useTokenPoolState>[0]> = {}) {
  const initialProps = { ...DEFAULT_INPUT, ...overrides }
  // A bare rerender() passes no props; keep the initial input.
  return renderHook((params?: typeof initialProps) => useTokenPoolState(params ?? initialProps), { initialProps })
}

describe('useTokenPoolState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefetchPools.mockResolvedValue(undefined)
    mockPoolQuery()
  })

  it('queries token pools sorted by TVL and refreshes once on mount', () => {
    const { rerender } = renderPoolState()

    expect(mockUseV2ListTokenPools).toHaveBeenCalledExactlyOnceWith({
      chainId: UniverseChainId.Mainnet,
      tokenAddress: TOKEN_ADDRESS,
      isNative: false,
      sortState: { sortBy: 'TVL', sortDirection: 'desc' },
      enabled: true,
    })
    expect(mockRefetchPools).toHaveBeenCalledExactlyOnceWith({ cancelRefetch: false })

    rerender()

    expect(mockRefetchPools).toHaveBeenCalledTimes(1)
  })

  it('waits for a fresh response before trusting hydrated pool counts', () => {
    const { result, rerender } = renderPoolState()
    expect(result.current.poolState).toEqual({ status: 'loading' })

    const cachedEmptyQuery = { pools: [], rawPoolCount: 0, isLoading: false, isSuccess: true }
    mockPoolQuery(cachedEmptyQuery)
    rerender()
    expect(result.current.poolState).toEqual({ status: 'loading' })

    mockPoolQuery({ ...cachedEmptyQuery, isFetchedAfterMount: true })
    rerender()
    expect(result.current.poolState).toEqual({ status: 'success', poolCount: 0 })

    mockPoolQuery({ ...cachedEmptyQuery, rawPoolCount: 2, isFetchedAfterMount: true })
    rerender()
    expect(result.current.poolState).toEqual({ status: 'success', poolCount: 2 })
  })

  it('reports a failed refresh instead of trusting retained empty data', () => {
    mockPoolQuery({ pools: [], rawPoolCount: 0, isLoading: false, isFetchedAfterMount: true, isError: true })

    const { result } = renderPoolState()

    expect(result.current.poolState).toEqual({ status: 'error' })
  })

  it('refreshes when the token, chain, or enabled state changes', () => {
    const { rerender } = renderPoolState()
    expect(mockRefetchPools).toHaveBeenCalledTimes(1)

    rerender({ ...DEFAULT_INPUT, tokenAddress: OTHER_TOKEN_ADDRESS })
    expect(mockRefetchPools).toHaveBeenCalledTimes(2)

    const otherChainInput: Parameters<typeof useTokenPoolState>[0] = {
      ...DEFAULT_INPUT,
      tokenAddress: OTHER_TOKEN_ADDRESS,
      chainId: UniverseChainId.Base,
    }
    rerender(otherChainInput)
    expect(mockRefetchPools).toHaveBeenCalledTimes(3)

    rerender({ ...otherChainInput, enabled: false })
    expect(mockRefetchPools).toHaveBeenCalledTimes(3)

    rerender(otherChainInput)
    expect(mockRefetchPools).toHaveBeenCalledTimes(4)
    expect(mockUseV2ListTokenPools).toHaveBeenLastCalledWith(
      expect.objectContaining({ chainId: UniverseChainId.Base, tokenAddress: OTHER_TOKEN_ADDRESS, enabled: true }),
    )
  })

  it.each([{ enabled: false }, { chainId: undefined }, { tokenAddress: undefined }, { tokenAddress: '' }])(
    'disables automatic and explicit refresh without eligible inputs %#',
    async (overrides) => {
      const { result } = renderPoolState(overrides)

      await act(async () => {
        await result.current.refetch()
      })

      expect(mockUseV2ListTokenPools).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
      expect(mockRefetchPools).not.toHaveBeenCalled()
      expect(result.current.poolState).toEqual({ status: 'loading' })
    },
  )

  it('exposes an explicit refresh that does not cancel an in-flight request', async () => {
    const { result } = renderPoolState()
    mockRefetchPools.mockClear()

    await act(async () => {
      await expect(result.current.refetch()).resolves.toBeUndefined()
    })

    expect(mockRefetchPools).toHaveBeenCalledExactlyOnceWith({ cancelRefetch: false })
  })
})
