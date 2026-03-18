import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SearchHistoryResultType } from 'uniswap/src/features/search/SearchHistoryResult'
import {
  addToSearchHistory,
  clearSearchHistory,
  initialSearchHistoryState,
  searchHistoryReducer,
  searchResultId,
} from 'uniswap/src/features/search/searchHistorySlice'

describe('searchHistorySlice', () => {
  describe('searchResultId', () => {
    it('generates correct id for token search result', () => {
      const result = searchResultId({
        type: SearchHistoryResultType.Token,
        chainId: UniverseChainId.Mainnet,
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      })
      expect(result).toBe('token-1-0x6b175474e89094c44da98b954eedeac495271d0f')
    })

    it('generates correct id for token with null address (native token)', () => {
      const result = searchResultId({
        type: SearchHistoryResultType.Token,
        chainId: UniverseChainId.Mainnet,
        address: null,
      })
      expect(result).toBe('token-1-null')
    })
  })

  describe('addToSearchHistory', () => {
    it('adds valid token search result to history', () => {
      const state = searchHistoryReducer(
        initialSearchHistoryState,
        addToSearchHistory({
          searchResult: {
            type: SearchHistoryResultType.Token,
            chainId: UniverseChainId.Mainnet,
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          },
        }),
      )

      expect(state.results).toHaveLength(1)
      expect(state.results[0]).toMatchObject({
        type: SearchHistoryResultType.Token,
        chainId: UniverseChainId.Mainnet,
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      })
    })

    it('rejects token search result with invalid chainId', () => {
      // 10143 is Monad testnet - not a valid UniverseChainId
      const invalidChainId = 10143 as UniverseChainId

      const state = searchHistoryReducer(
        initialSearchHistoryState,
        addToSearchHistory({
          searchResult: {
            type: SearchHistoryResultType.Token,
            chainId: invalidChainId,
            address: '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
          },
        }),
      )

      // Should not add the invalid token to history
      expect(state.results).toHaveLength(0)
    })

    it('rejects token search result with invalid chainId and null address', () => {
      // This is the exact data that caused the crash
      const invalidChainId = 10143 as UniverseChainId

      const state = searchHistoryReducer(
        initialSearchHistoryState,
        addToSearchHistory({
          searchResult: {
            type: SearchHistoryResultType.Token,
            chainId: invalidChainId,
            address: null,
          },
        }),
      )

      // Should not add the invalid token to history
      expect(state.results).toHaveLength(0)
    })

    it('does not crash when processing the exact problematic data from production', () => {
      // Simulate the exact scenario that caused the production crash
      const problematicSearchResults = [
        {
          type: SearchHistoryResultType.Token as const,
          chainId: 10143 as UniverseChainId, // Invalid: Monad testnet
          address: null,
          searchId: 'token-10143-null',
        },
        {
          type: SearchHistoryResultType.Token as const,
          chainId: 10143 as UniverseChainId, // Invalid: Monad testnet
          address: '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37' as Address,
          searchId: 'token-10143-0xb5a30b0fdc5ea94a52fdc42e3e9760cb8449fb37',
        },
        {
          type: SearchHistoryResultType.Token as const,
          chainId: UniverseChainId.Mainnet, // Valid
          address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' as Address,
          searchId: 'token-1-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        },
      ]

      let state = initialSearchHistoryState

      // Adding each result should not throw
      for (const searchResult of problematicSearchResults) {
        expect(() => {
          state = searchHistoryReducer(state, addToSearchHistory({ searchResult }))
        }).not.toThrow()
      }

      // Only the valid token (Mainnet WBTC) should be in the history
      expect(state.results).toHaveLength(1)
      expect(state.results[0]).toMatchObject({
        type: SearchHistoryResultType.Token,
        chainId: UniverseChainId.Mainnet,
      })
    })

    it('allows wallet and etherscan search results regardless of chainId validation', () => {
      const state = searchHistoryReducer(
        initialSearchHistoryState,
        addToSearchHistory({
          searchResult: {
            type: SearchHistoryResultType.WalletByAddress,
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          },
        }),
      )

      expect(state.results).toHaveLength(1)
    })
  })

  describe('clearSearchHistory', () => {
    it('clears all search history', () => {
      // First add some items
      let state = searchHistoryReducer(
        initialSearchHistoryState,
        addToSearchHistory({
          searchResult: {
            type: SearchHistoryResultType.Token,
            chainId: UniverseChainId.Mainnet,
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          },
        }),
      )

      expect(state.results).toHaveLength(1)

      // Then clear
      state = searchHistoryReducer(state, clearSearchHistory())

      expect(state.results).toHaveLength(0)
    })
  })
})
