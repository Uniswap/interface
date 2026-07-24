import { usePoolsListRenderData } from 'src/screens/HomeScreen/portfolio/tabs/pools/hooks/usePoolsListRenderData'
import { renderHook } from 'src/test/test-utils'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import type { MockedFunction } from 'vitest'
import { usePendingLiquidityTransactionsChangeListener } from 'wallet/src/features/transactions/hooks/usePendingLiquidityTransactionsChangeListener'

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ chains: [1] }),
}))

vi.mock('uniswap/src/features/positions/hooks/useWalletPositions', () => ({
  useWalletPositions: vi.fn(),
}))

vi.mock('wallet/src/features/transactions/hooks/usePendingLiquidityTransactionsChangeListener', () => ({
  usePendingLiquidityTransactionsChangeListener: vi.fn(),
}))

const mockUseWalletPositions = useWalletPositions as MockedFunction<typeof useWalletPositions>
const mockUseLpListener = usePendingLiquidityTransactionsChangeListener as MockedFunction<
  typeof usePendingLiquidityTransactionsChangeListener
>

const baseResult = {
  positions: [],
  hiddenPositions: [],
  allPositions: [],
  hasData: true,
  error: null,
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,
  isPlaceholderData: false,
  hasNextPage: false,
  refetch: vi.fn(),
  fetchNextPage: vi.fn(),
} as unknown as ReturnType<typeof useWalletPositions>

describe('usePoolsListRenderData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWalletPositions.mockReturnValue(baseResult)
  })

  it('forwards positions and query state from useWalletPositions', () => {
    const positions = [{ poolId: 'a' }] as unknown as ReturnType<typeof useWalletPositions>['positions']
    mockUseWalletPositions.mockReturnValue({ ...baseResult, positions, hasData: true, isFetching: true })

    const { result } = renderHook(() => usePoolsListRenderData({ owner: '0xabc', skip: false }))

    expect(result.current.positions).toBe(positions)
    expect(result.current.isFetching).toBe(true)
    expect(result.current.hasData).toBe(true)
  })

  it('forwards hidden positions from useWalletPositions', () => {
    const hiddenPositions = [{ poolId: 'h' }] as unknown as ReturnType<typeof useWalletPositions>['hiddenPositions']
    mockUseWalletPositions.mockReturnValue({ ...baseResult, hiddenPositions })

    const { result } = renderHook(() => usePoolsListRenderData({ owner: '0xabc', skip: false }))

    expect(result.current.hiddenPositions).toBe(hiddenPositions)
  })

  it('fetches all statuses + hidden and forwards `skip` as the disabled flag', () => {
    renderHook(() => usePoolsListRenderData({ owner: '0xabc', skip: true }))

    expect(mockUseWalletPositions).toHaveBeenCalledWith(
      expect.objectContaining({ account: '0xabc', includeHidden: true, autoFetchAllPages: false, disabled: true }),
    )
    // No explicit pageSize so the cache key matches usePoolsTabVisibility's default.
    expect(mockUseWalletPositions.mock.calls[0]?.[0]).not.toHaveProperty('pageSize')
  })

  it('registers refetch with the pending-LP-transactions listener', () => {
    const refetch = vi.fn()
    mockUseWalletPositions.mockReturnValue({ ...baseResult, refetch })

    renderHook(() => usePoolsListRenderData({ owner: '0xabc', skip: false }))

    expect(mockUseLpListener).toHaveBeenCalledWith(refetch)
  })

  it('fetches the next page on end reached when another page is available', () => {
    const fetchNextPage = vi.fn()
    mockUseWalletPositions.mockReturnValue({
      ...baseResult,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    })

    const { result } = renderHook(() => usePoolsListRenderData({ owner: '0xabc', skip: false }))
    result.current.onListEndReached()

    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('does not fetch the next page when there is none', () => {
    const fetchNextPage = vi.fn()
    mockUseWalletPositions.mockReturnValue({ ...baseResult, hasNextPage: false, fetchNextPage })

    const { result } = renderHook(() => usePoolsListRenderData({ owner: '0xabc', skip: false }))
    result.current.onListEndReached()

    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('does not fetch the next page while one is already loading', () => {
    const fetchNextPage = vi.fn()
    mockUseWalletPositions.mockReturnValue({
      ...baseResult,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage,
    })

    const { result } = renderHook(() => usePoolsListRenderData({ owner: '0xabc', skip: false }))
    result.current.onListEndReached()

    expect(fetchNextPage).not.toHaveBeenCalled()
  })
})
