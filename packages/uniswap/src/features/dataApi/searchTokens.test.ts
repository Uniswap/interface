import { SearchType } from '@uniswap/client-data-api/dist/data/v1/searchTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { filterMultichainResultsToChain, useMultichainSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import type { CurrencyInfo, MultichainSearchResult } from 'uniswap/src/features/dataApi/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { renderHook } from 'uniswap/src/test/test-utils'

const { mockUseConnectionStatus, mockUseEnabledChains, mockUseSearchTokensAndPoolsQuery, mockUseFeatureFlag } =
  vi.hoisted(() => ({
    mockUseConnectionStatus: vi.fn(),
    mockUseEnabledChains: vi.fn(),
    mockUseSearchTokensAndPoolsQuery: vi.fn(),
    mockUseFeatureFlag: vi.fn(),
  }))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useConnectionStatus: mockUseConnectionStatus,
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/data/rest/searchTokensAndPools', () => ({
  useSearchTokensAndPoolsQuery: mockUseSearchTokensAndPoolsQuery,
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
}))

describe(useMultichainSearchTokens, () => {
  beforeEach(() => {
    mockUseConnectionStatus.mockImplementation((platform: Platform) => ({
      isConnected: platform === Platform.SVM,
    }))
    mockUseEnabledChains.mockReturnValue({
      chains: [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.Robinhood],
    })
    mockUseSearchTokensAndPoolsQuery.mockReturnValue({
      data: [],
      error: null,
      isPending: false,
      refetch: vi.fn(),
    })
    mockUseFeatureFlag.mockReturnValue(false)
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

    expect(mockUseSearchTokensAndPoolsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base],
          searchQuery: 'cash',
          searchType: SearchType.TOKEN,
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

    expect(mockUseSearchTokensAndPoolsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          chainIds: [UniverseChainId.Base],
        }),
      }),
    )
  })

  it('sets useSubstreamData to false when V2EndpointsTokens is disabled', () => {
    mockUseFeatureFlag.mockReturnValue(false)

    renderHook(() =>
      useMultichainSearchTokens({
        searchQuery: 'cash',
        chainFilter: null,
        skip: false,
      }),
    )

    expect(mockUseSearchTokensAndPoolsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ useSubstreamData: false }),
      }),
    )
  })

  it('sets useSubstreamData to true when V2EndpointsTokens is enabled', () => {
    mockUseFeatureFlag.mockReturnValue(true)

    renderHook(() =>
      useMultichainSearchTokens({
        searchQuery: 'cash',
        chainFilter: null,
        skip: false,
      }),
    )

    expect(mockUseSearchTokensAndPoolsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ useSubstreamData: true }),
      }),
    )
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
