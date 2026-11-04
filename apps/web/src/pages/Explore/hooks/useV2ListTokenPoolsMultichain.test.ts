import { UniverseChainId } from '@universe/chains'
import { PoolSortFields } from '~/data/pools/poolStats'
import { OrderDirection } from '~/data/util'
import { useListPoolsAsPoolStats } from '~/pages/Explore/hooks/useListPoolsAsPoolStats'
import { useV2ListTokenPoolsMultichain } from '~/pages/Explore/hooks/useV2ListTokenPoolsMultichain'
import { renderHook } from '~/test-utils/render'
import type { PoolStat } from '~/types/explore'

vi.mock('~/pages/Explore/hooks/useListPoolsAsPoolStats')

const mockUseListPoolsAsPoolStats = vi.mocked(useListPoolsAsPoolStats)

const sortState = { sortBy: PoolSortFields.TVL, sortDirection: OrderDirection.Desc }

const MAINNET_ADDRESS = '0x1111111111111111111111111111111111111111'
const BASE_ADDRESS = '0x2222222222222222222222222222222222222222'
const OTHER_ADDRESS = '0x3333333333333333333333333333333333333333'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const entries = [
  { chainId: UniverseChainId.Mainnet, address: MAINNET_ADDRESS, isNative: false },
  { chainId: UniverseChainId.Base, address: BASE_ADDRESS, isNative: false },
]

function poolStat({ chainId, token0, token1 }: { chainId: UniverseChainId; token0: string; token1: string }): PoolStat {
  return {
    id: `${chainId}-${token0}-${token1}`,
    chainId,
    token0: { address: token0 },
    token1: { address: token1 },
  } as unknown as PoolStat
}

function mockFetchedPools(
  pools: PoolStat[],
  overrides: Partial<ReturnType<typeof useListPoolsAsPoolStats>> = {},
): void {
  mockUseListPoolsAsPoolStats.mockReturnValue({
    pools,
    rawPoolCount: pools.length,
    isLoading: false,
    isSuccess: true,
    isFetchedAfterMount: true,
    refetch: vi.fn(),
    isError: false,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    ...overrides,
  })
}

describe('useV2ListTokenPoolsMultichain', () => {
  it('issues a single request covering every deployment chainId', () => {
    mockFetchedPools([])

    renderHook(() => useV2ListTokenPoolsMultichain({ entries, sortState }))

    expect(mockUseListPoolsAsPoolStats).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base],
          filter: expect.objectContaining({
            tokenFilter: expect.objectContaining({ tokens: [MAINNET_ADDRESS, BASE_ADDRESS] }),
          }),
        }),
      }),
    )
  })

  it('drops cross-matched pools — an address matched on a chain where it is not this token', () => {
    const kept = poolStat({ chainId: UniverseChainId.Mainnet, token0: MAINNET_ADDRESS, token1: OTHER_ADDRESS })
    // The mainnet deployment's address showing up in a Base pool is a different (possibly
    // squatted same-address) token, not this one.
    const crossMatched = poolStat({ chainId: UniverseChainId.Base, token0: MAINNET_ADDRESS, token1: OTHER_ADDRESS })
    mockFetchedPools([kept, crossMatched])

    const { result } = renderHook(() => useV2ListTokenPoolsMultichain({ entries, sortState }))

    expect(result.current.pools).toEqual([kept])
  })

  it('keeps zero-address (V4 native) pools only on chains where the entry is native', () => {
    const nativeEntries = [
      { chainId: UniverseChainId.Mainnet, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', isNative: true },
      { chainId: UniverseChainId.Base, address: BASE_ADDRESS, isNative: false },
    ]
    const nativePool = poolStat({ chainId: UniverseChainId.Mainnet, token0: ZERO_ADDRESS, token1: OTHER_ADDRESS })
    const wrappedPool = poolStat({
      chainId: UniverseChainId.Mainnet,
      // Mainnet WETH — the wrapped address the native entry resolves to.
      token0: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      token1: OTHER_ADDRESS,
    })
    const foreignNativePool = poolStat({ chainId: UniverseChainId.Base, token0: ZERO_ADDRESS, token1: OTHER_ADDRESS })
    mockFetchedPools([nativePool, wrappedPool, foreignNativePool])

    const { result } = renderHook(() => useV2ListTokenPoolsMultichain({ entries: nativeEntries, sortState }))

    expect(result.current.pools).toEqual([nativePool, wrappedPool])
  })

  it('auto-advances past a page whose rows were all filtered out, so infinite scroll is not stalled', () => {
    const fetchNextPage = vi.fn()
    const crossMatched = poolStat({ chainId: UniverseChainId.Base, token0: MAINNET_ADDRESS, token1: OTHER_ADDRESS })
    mockFetchedPools([crossMatched], { fetchNextPage, hasNextPage: true })

    const { result } = renderHook(() => useV2ListTokenPoolsMultichain({ entries, sortState }))

    expect(result.current.pools).toEqual([])
    expect(fetchNextPage).toHaveBeenCalled()
  })

  it('stops auto-advancing when the next-page fetch failed, instead of re-firing indefinitely', () => {
    const fetchNextPage = vi.fn()
    // A fully-filtered page plus a failing next-page fetch: every other auto-advance condition
    // stays satisfied, so an unguarded effect would retry forever.
    const crossMatched = poolStat({ chainId: UniverseChainId.Base, token0: MAINNET_ADDRESS, token1: OTHER_ADDRESS })
    mockFetchedPools([crossMatched], {
      fetchNextPage,
      hasNextPage: true,
      isError: true,
      error: new Error('next page failed'),
    })

    const { result } = renderHook(() => useV2ListTokenPoolsMultichain({ entries, sortState }))

    expect(result.current.pools).toEqual([])
    expect(fetchNextPage).not.toHaveBeenCalled()
    expect(result.current.isError).toBe(true)
  })
})
