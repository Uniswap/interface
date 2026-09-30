import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { useListRankedRwasQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRankedRwas'
import { makeRankedRwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/rankedRwaTestHelpers'
import { useRwaIssuerMetricsIndex } from 'uniswap/src/features/search/SearchModal/stocks/useRwaIssuerMetricsIndex'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/data/apiClients/dataApiService/rwa/listRankedRwas', () => ({ useListRankedRwasQuery: vi.fn() }))

const mockUseListRankedRwasQuery = vi.mocked(useListRankedRwasQuery)

function mockRankedResponse(data: unknown): void {
  mockUseListRankedRwasQuery.mockReturnValue({ data } as unknown as ReturnType<typeof useListRankedRwasQuery>)
}

const RANKED_RESPONSE = {
  rwas: [
    makeRankedRwa({
      issuerTokens: [
        {
          symbol: 'TSLAON',
          name: 'Tesla (Ondo)',
          issuer: 'ondo',
          priceUsd: 248.42,
          volume24hUsd: 8_000_000,
          chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0xondo1' }],
        },
      ],
    }),
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRankedResponse(undefined)
})

describe(useRwaIssuerMetricsIndex, () => {
  it('requests ranked stocks scoped to the chain filter, without sparklines', () => {
    renderHook(() =>
      useRwaIssuerMetricsIndex({ category: RwaCategory.STOCKS, chainFilter: UniverseChainId.Base, enabled: true }),
    )
    expect(mockUseListRankedRwasQuery).toHaveBeenCalledWith({
      category: RwaCategory.STOCKS,
      chainIds: [UniverseChainId.Base],
      includeSparkline1d: false,
      enabled: true,
    })
  })

  it('requests the given category', () => {
    renderHook(() => useRwaIssuerMetricsIndex({ category: RwaCategory.COMMODITIES, chainFilter: null, enabled: true }))
    expect(mockUseListRankedRwasQuery).toHaveBeenCalledWith(
      expect.objectContaining({ category: RwaCategory.COMMODITIES }),
    )
  })

  it('requests all chains when there is no chain filter', () => {
    renderHook(() => useRwaIssuerMetricsIndex({ category: RwaCategory.STOCKS, chainFilter: null, enabled: true }))
    expect(mockUseListRankedRwasQuery).toHaveBeenCalledWith(expect.objectContaining({ chainIds: [] }))
  })

  it('returns undefined while the query has no data', () => {
    const { result } = renderHook(() =>
      useRwaIssuerMetricsIndex({ category: RwaCategory.STOCKS, chainFilter: null, enabled: true }),
    )
    expect(result.current).toBeUndefined()
  })

  it('returns undefined when disabled, even with cached data', () => {
    mockRankedResponse(RANKED_RESPONSE)
    const { result } = renderHook(() =>
      useRwaIssuerMetricsIndex({ category: RwaCategory.STOCKS, chainFilter: null, enabled: false }),
    )
    expect(result.current).toBeUndefined()
  })

  it('indexes issuer metrics by chain deployment', () => {
    mockRankedResponse(RANKED_RESPONSE)
    const { result } = renderHook(() =>
      useRwaIssuerMetricsIndex({ category: RwaCategory.STOCKS, chainFilter: null, enabled: true }),
    )
    expect(result.current?.size).toBe(1)
    expect([...(result.current?.values() ?? [])][0]).toMatchObject({ priceUsd: 248.42, volume24hUsd: 8_000_000 })
  })
})
