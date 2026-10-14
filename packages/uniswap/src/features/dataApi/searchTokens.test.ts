import { SearchResponse, SearchType } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import { UniverseChainId } from '@universe/chains'
import { filterMultichainResultsToChain, useMultichainSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import type { CurrencyInfo, MultichainSearchResult } from 'uniswap/src/features/dataApi/types'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'
import { renderHook } from 'uniswap/src/test/test-utils'

const { mockUseEnabledChains, mockUseSearchQuery } = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockUseSearchQuery: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/search/search', () => ({
  useSearchQuery: mockUseSearchQuery,
}))

function getSelect(): (data: SearchResponse) => MultichainSearchResult[] {
  const { select } = mockUseSearchQuery.mock.calls.at(-1)?.[0] as {
    select: (data: SearchResponse) => MultichainSearchResult[]
  }
  return select
}

describe(useMultichainSearchTokens, () => {
  beforeEach(() => {
    mockUseEnabledChains.mockReturnValue({
      chains: [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.Robinhood],
    })
    mockUseSearchQuery.mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    })
  })

  it('passes the v2 request shape over all enabled chains by default', () => {
    const data: MultichainSearchResult[] = []
    mockUseSearchQuery.mockReturnValue({ data, error: null, isLoading: false, refetch: vi.fn() })

    const { result } = renderHook(() =>
      useMultichainSearchTokens({ searchQuery: 'cash', chainFilter: null, skip: false }),
    )

    expect(mockUseSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        input: expect.objectContaining({
          searchQuery: 'cash',
          chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.Robinhood],
          types: [SearchType.TOKEN],
          maxResults: expect.any(Number),
        }),
      }),
    )
    expect(result.current.data).toBe(data)
  })

  it('passes the provided chainIds when all networks is selected in a constrained selector', () => {
    renderHook(() =>
      useMultichainSearchTokens({
        searchQuery: 'cash',
        chainFilter: null,
        chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base],
        skip: false,
      }),
    )

    expect(mockUseSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base],
          searchQuery: 'cash',
        }),
      }),
    )
  })

  it('uses the selected chainFilter over the provided chainIds', () => {
    renderHook(() =>
      useMultichainSearchTokens({
        searchQuery: 'cash',
        chainFilter: UniverseChainId.Base,
        chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base],
        skip: false,
      }),
    )

    expect(mockUseSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          chainIds: [UniverseChainId.Base],
        }),
      }),
    )
  })

  it('disables the query when skipped', () => {
    renderHook(() => useMultichainSearchTokens({ searchQuery: 'cash', chainFilter: null, skip: true }))

    expect(mockUseSearchQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('appends suppressed tokens after default tokens in the select', () => {
    renderHook(() => useMultichainSearchTokens({ searchQuery: 'cash', chainFilter: null, skip: false }))

    const response = new SearchResponse({
      tokens: [createRankedMultichainToken({ multichainId: 'mc:default' })],
      suppressedTokens: [createRankedMultichainToken({ multichainId: 'mc:suppressed' })],
    })

    const results = getSelect()(response)
    expect(results.map((r) => r.id)).toEqual(['mc:default', 'mc:suppressed'])
    expect(results.map((r) => r.isSuppressed)).toEqual([false, true])
    expect(results[1]?.tokens[0]?.searchMultichainParent?.isSuppressed).toBe(true)
  })

  it('caps combined default + suppressed tokens at the requested size', () => {
    renderHook(() => useMultichainSearchTokens({ searchQuery: 'cash', chainFilter: null, skip: false, size: 2 }))

    const response = new SearchResponse({
      tokens: [
        createRankedMultichainToken({ multichainId: 'mc:first' }),
        createRankedMultichainToken({ multichainId: 'mc:second' }),
      ],
      suppressedTokens: [createRankedMultichainToken({ multichainId: 'mc:suppressed' })],
    })

    expect(getSelect()(response).map((r) => r.id)).toEqual(['mc:first', 'mc:second'])
  })
})

describe(filterMultichainResultsToChain, () => {
  function createResult(chainIds: UniverseChainId[]): MultichainSearchResult {
    return {
      id: 'mc:sol',
      name: 'Moo Deng',
      symbol: 'MOODENG',
      logoUrl: undefined,
      tokens: chainIds.map((chainId) => ({ currency: { chainId } }) as unknown as CurrencyInfo),
    }
  }

  it('prunes a group to only the tokens on the selected chain', () => {
    const filtered = filterMultichainResultsToChain(
      [createResult([UniverseChainId.Solana, UniverseChainId.Mainnet])],
      UniverseChainId.Mainnet,
    )

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.tokens.map((token) => token.currency.chainId)).toEqual([UniverseChainId.Mainnet])
  })

  it('drops groups left with no tokens on the selected chain', () => {
    const filtered = filterMultichainResultsToChain(
      [createResult([UniverseChainId.Solana, UniverseChainId.Mainnet])],
      UniverseChainId.Base,
    )

    expect(filtered).toEqual([])
  })

  it('returns results unchanged when no chain is selected', () => {
    const results = [createResult([UniverseChainId.Solana, UniverseChainId.Mainnet])]
    const filtered = filterMultichainResultsToChain(results, null)

    expect(filtered).toBe(results)
  })
})
