import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { useListRwaTokensQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRwaTokens'
import { useExploreRwaTokens } from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreRwaTokens'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/data/apiClients/dataApiService/rwa/listRwaTokens', () => ({
  useListRwaTokensQuery: vi.fn(),
}))

const mockUseListRwaTokensQuery = vi.mocked(useListRwaTokensQuery)

describe('useExploreRwaTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseListRwaTokensQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false } as never)
  })

  it('reads Commodities from ListRwaTokens with the given chain scope', () => {
    renderHook(() => useExploreRwaTokens({ category: RwaCategory.COMMODITIES, chainIds: [UniverseChainId.Mainnet] }))

    expect(mockUseListRwaTokensQuery).toHaveBeenCalledWith({
      category: RwaCategory.COMMODITIES,
      chainIds: [UniverseChainId.Mainnet],
      includeSparkline1d: true,
      enabled: true,
    })
  })

  it('surfaces the query loading and error state with no rows', () => {
    mockUseListRwaTokensQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false } as never)

    const { result } = renderHook(() => useExploreRwaTokens({ category: RwaCategory.COMMODITIES }))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(false)
    expect(result.current.rows).toEqual([])
  })
})
