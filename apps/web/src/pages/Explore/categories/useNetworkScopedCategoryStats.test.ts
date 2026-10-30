import { UniverseChainId } from '@universe/chains'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { useListPoolCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery'
import type { PoolCategory, TokenCategory, TokenCategoryStats } from 'uniswap/src/features/tokenCategories/types'
import { poolCategory } from 'uniswap/src/test/fixtures/poolCategory'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { useNetworkScopedCategoryStats } from '~/pages/Explore/categories/useNetworkScopedCategoryStats'
import { mocked } from '~/test-utils/mocked'
import { renderHook } from '~/test-utils/render'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery', () => ({
  useListCategoriesQuery: vi.fn(),
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery', () => ({
  useListPoolCategoriesQuery: vi.fn(() => ({ data: undefined, isPlaceholderData: false })),
}))
vi.mock('~/utils/params/chainParams', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/utils/params/chainParams')>()),
  useChainIdFromUrlParam: vi.fn(),
}))

function stats(tokenCount: number): TokenCategoryStats {
  return { tokenCount, priceChange24hPct: 0, volume1h: 0, volume1d: 0, volume1w: 0, volume1m: 0, volume1y: 0 }
}

const gaming = tokenCategory({ id: 'gaming', stats: stats(40) })
const defi = tokenCategory({ id: 'defi', stats: stats(25) })

function mockScopedQuery({
  data,
  isPlaceholderData = false,
  isFetching = false,
  failureCount = 0,
}: {
  data: TokenCategory[] | undefined
  isPlaceholderData?: boolean
  isFetching?: boolean
  failureCount?: number
}): void {
  mocked(useListCategoriesQuery).mockReturnValue({ data, isPlaceholderData, isFetching, failureCount } as ReturnType<
    typeof useListCategoriesQuery
  >)
}

describe('useNetworkScopedCategoryStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useChainIdFromUrlParam).mockReturnValue(undefined)
    mockScopedQuery({ data: undefined })
  })

  it('scopes stats to the selected EVM network', () => {
    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.Base)
    renderHook(() => useNetworkScopedCategoryStats('token'))

    expect(useListCategoriesQuery).toHaveBeenCalledWith({ chainIds: [UniverseChainId.Base], enabled: true })
  })

  it('reads Solana as All networks rather than requesting an unsupported scope', () => {
    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.Solana)
    renderHook(() => useNetworkScopedCategoryStats('token'))

    expect(useListCategoriesQuery).toHaveBeenCalledWith({ chainIds: undefined, enabled: true })
  })

  it('reads scoped counts, and an empty count for a category the scoped response omits', () => {
    mockScopedQuery({ data: [tokenCategory({ id: 'gaming', stats: stats(3) })] })
    const { result } = renderHook(() => useNetworkScopedCategoryStats('token'))

    expect(result.current.getScopedStats(gaming)?.count).toBe(3)
    expect(result.current.isCategoryEmpty(gaming)).toBe(false)
    expect(result.current.isCategoryEmpty(defi)).toBe(true)
  })

  it('falls back to the category stats while the scoped response is a previous network placeholder', () => {
    mockScopedQuery({ data: [tokenCategory({ id: 'gaming', stats: stats(0) })], isPlaceholderData: true })
    const { result } = renderHook(() => useNetworkScopedCategoryStats('token'))

    expect(result.current.getScopedStats(gaming)?.count).toBe(40)
    expect(result.current.getScopedStats(defi)?.count).toBe(25)
  })

  it('reads pool counts from the pool query for pool categories', () => {
    const majors: PoolCategory = poolCategory({
      id: 'major-pools',
      stats: { poolCount: 7, tvl: 1, volume1d: 1, volume1w: 1, volume1m: 1, fees1d: 1 },
    })
    mocked(useListPoolCategoriesQuery).mockReturnValue({ data: [majors], isPlaceholderData: false } as ReturnType<
      typeof useListPoolCategoriesQuery
    >)
    const { result } = renderHook(() => useNetworkScopedCategoryStats('pool'))

    expect(result.current.getScopedStats(majors)?.count).toBe(7)
  })

  it('is pending while an uncached network is on its first attempt', () => {
    mockScopedQuery({ data: [gaming], isPlaceholderData: true, isFetching: true })
    const { result } = renderHook(() => useNetworkScopedCategoryStats('token'))

    expect(result.current.scopedStatsPending).toBe(true)
  })

  it('is not pending for a cached network, even while it refetches in the background', () => {
    mockScopedQuery({ data: [gaming], isFetching: true })
    const { result } = renderHook(() => useNetworkScopedCategoryStats('token'))

    expect(result.current.scopedStatsPending).toBe(false)
  })

  it('stops pending once the first attempt fails, so retries fall back to All networks stats', () => {
    mockScopedQuery({ data: undefined, isFetching: true, failureCount: 1 })
    const { result } = renderHook(() => useNetworkScopedCategoryStats('token'))

    expect(result.current.scopedStatsPending).toBe(false)
    expect(result.current.getScopedStats(gaming)?.count).toBe(40)
  })
})
