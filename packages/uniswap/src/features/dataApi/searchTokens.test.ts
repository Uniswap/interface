import { SearchType } from '@uniswap/client-data-api/dist/data/v1/searchTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useMultichainSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { renderHook } from 'uniswap/src/test/test-utils'

const { mockUseConnectionStatus, mockUseEnabledChains, mockUseSearchTokensAndPoolsQuery } = vi.hoisted(() => ({
  mockUseConnectionStatus: vi.fn(),
  mockUseEnabledChains: vi.fn(),
  mockUseSearchTokensAndPoolsQuery: vi.fn(),
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
})
