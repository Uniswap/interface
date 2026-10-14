import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { SearchAuction, SearchResponse, SearchType } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import { Pool, RankedPool, Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { type SearchResults, toSearchResults, useSearchResults } from 'uniswap/src/features/dataApi/searchResults'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'
import { renderHook } from 'uniswap/src/test/test-utils'

const { mockUseEnabledChains, mockUseSearchQuery } = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockUseSearchQuery: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/search/search', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/search/search')>()),
  useSearchQuery: mockUseSearchQuery,
}))

const TOKEN0_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const TOKEN1_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const ALL_TYPES = [SearchType.TOKEN, SearchType.POOL, SearchType.AUCTION, SearchType.CATEGORY]

function createRankedPool({ poolId, feeTier }: { poolId: string; feeTier?: number }): RankedPool {
  return new RankedPool({
    pool: new Pool({
      chainId: UniverseChainId.Mainnet,
      poolId,
      token0: new Token({ chainId: UniverseChainId.Mainnet, address: TOKEN0_ADDRESS }),
      token1: new Token({ chainId: UniverseChainId.Mainnet, address: TOKEN1_ADDRESS }),
      protocolVersion: ProtocolVersion.V3,
      feeTier,
    }),
  })
}

function getSelect(): (data: SearchResponse) => SearchResults {
  const { select } = mockUseSearchQuery.mock.calls.at(-1)?.[0] as { select: (data: SearchResponse) => SearchResults }
  return select
}

describe(useSearchResults, () => {
  beforeEach(() => {
    mockUseEnabledChains.mockReturnValue({
      chains: [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.Solana],
    })
    mockUseSearchQuery.mockReturnValue({ data: undefined, error: null, isLoading: false, refetch: vi.fn() })
  })

  it('sends one request carrying every requested type over all enabled chains', () => {
    renderHook(() => useSearchResults({ searchQuery: 'usdc', chainFilter: null, types: ALL_TYPES, skip: false }))

    expect(mockUseSearchQuery).toHaveBeenCalledTimes(1)
    expect(mockUseSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        input: {
          searchQuery: 'usdc',
          chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.Solana],
          types: ALL_TYPES,
          maxResults: expect.any(Number),
        },
      }),
    )
  })

  it('restricts the request to the selected chainFilter', () => {
    renderHook(() =>
      useSearchResults({ searchQuery: 'usdc', chainFilter: UniverseChainId.Base, types: ALL_TYPES, skip: false }),
    )

    expect(mockUseSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ chainIds: [UniverseChainId.Base] }) }),
    )
  })

  it('disables the request when skipped or when no types are requested', () => {
    renderHook(() => useSearchResults({ searchQuery: 'usdc', chainFilter: null, types: ALL_TYPES, skip: true }))
    expect(mockUseSearchQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))

    renderHook(() => useSearchResults({ searchQuery: 'usdc', chainFilter: null, types: [], skip: false }))
    expect(mockUseSearchQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('splits the response into per-type buckets through the select', () => {
    renderHook(() => useSearchResults({ searchQuery: 'usdc', chainFilter: null, types: ALL_TYPES, skip: false }))

    const auction = new SearchAuction({ auctionId: '1_0x0000000000000000000000000000000000000001' })
    const results = getSelect()(
      new SearchResponse({
        tokens: [createRankedMultichainToken({ multichainId: 'mc:default' })],
        suppressedTokens: [createRankedMultichainToken({ multichainId: 'mc:suppressed' })],
        pools: [createRankedPool({ poolId: '0xpool', feeTier: 500 })],
        auctions: [auction],
        categoryIds: ['stablecoins'],
      }),
    )

    expect(results.tokens.map((r) => [r.id, r.isSuppressed])).toEqual([
      ['mc:default', false],
      ['mc:suppressed', true],
    ])
    expect(results.pools.map((pool) => pool.poolId)).toEqual(['0xpool'])
    expect(results.auctions).toEqual([auction])
    expect(results.categoryIds).toEqual(['stablecoins'])
  })
})

describe(toSearchResults, () => {
  it('caps default + suppressed tokens at the requested size and drops unconvertible pools', () => {
    const results = toSearchResults({
      response: new SearchResponse({
        tokens: [
          createRankedMultichainToken({ multichainId: 'mc:first' }),
          createRankedMultichainToken({ multichainId: 'mc:second' }),
        ],
        suppressedTokens: [createRankedMultichainToken({ multichainId: 'mc:suppressed' })],
        pools: [createRankedPool({ poolId: '0xkept', feeTier: 500 }), createRankedPool({ poolId: '0xnofee' })],
      }),
      chainFilter: null,
      size: 2,
    })

    expect(results.tokens.map((r) => r.id)).toEqual(['mc:first', 'mc:second'])
    expect(results.pools.map((pool) => pool.poolId)).toEqual(['0xkept'])
    expect(results.auctions).toEqual([])
    expect(results.categoryIds).toEqual([])
  })
})
