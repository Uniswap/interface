import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import {
  MultichainTokenSearchHistoryResult,
  PoolSearchHistoryResult,
  SearchHistoryResult,
  SearchHistoryResultType,
  TokenSearchHistoryResult,
  WalletByAddressSearchHistoryResult,
} from 'uniswap/src/features/search/SearchHistoryResult'
import {
  addToSearchHistory,
  clearSearchHistory,
  initialSearchHistoryState,
  SearchHistoryState,
  searchHistoryReducer,
  searchResultId,
} from 'uniswap/src/features/search/searchHistorySlice'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'

const WALLET_RESULT: WalletByAddressSearchHistoryResult = {
  type: SearchHistoryResultType.WalletByAddress,
  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
}

const POOL_RESULT: PoolSearchHistoryResult = {
  type: SearchHistoryResultType.Pool,
  chainId: UniverseChainId.Mainnet,
  poolId: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
  protocolVersion: ProtocolVersion.V3,
  feeTier: 500,
  token0CurrencyId: buildCurrencyId(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  token1CurrencyId: buildCurrencyId(UniverseChainId.Mainnet, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
}

function tokenAddress(i: number): Address {
  return `0x${i.toString(16).padStart(40, '0')}`
}

function token(i: number): TokenSearchHistoryResult {
  return { type: SearchHistoryResultType.Token, chainId: UniverseChainId.Mainnet, address: tokenAddress(i) }
}

function multichainToken(i: number): MultichainTokenSearchHistoryResult {
  return {
    type: SearchHistoryResultType.MultichainToken,
    multichainId: `mc:${i}`,
    name: `Token ${i}`,
    symbol: `T${i}`,
    tokenCurrencyIds: [buildCurrencyId(UniverseChainId.Mainnet, tokenAddress(i))],
  }
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

function addAll(results: SearchHistoryResult[]): SearchHistoryState {
  return results.reduce(
    (state, searchResult) => searchHistoryReducer(state, addToSearchHistory({ searchResult })),
    initialSearchHistoryState,
  )
}

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

    it('generates correct id for multichain token search result', () => {
      const result = searchResultId({
        type: SearchHistoryResultType.MultichainToken,
        multichainId: 'mc:usdc',
        name: 'USD Coin',
        symbol: 'USDC',
        tokenCurrencyIds: [buildCurrencyId(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')],
      })
      expect(result).toBe('multichain-token-mc:usdc-all')
    })

    it('generates distinct ids for multichain token with and without TDP chain filter', () => {
      const base = {
        type: SearchHistoryResultType.MultichainToken as const,
        multichainId: 'mc:eth',
        name: 'Ether',
        symbol: 'ETH',
        tokenCurrencyIds: [buildNativeCurrencyId(UniverseChainId.Mainnet)],
      }
      expect(searchResultId(base)).toBe('multichain-token-mc:eth-all')
      expect(
        searchResultId({
          ...base,
          tdpChainFilter: UniverseChainId.Unichain,
        }),
      ).toBe(`multichain-token-mc:eth-${UniverseChainId.Unichain}`)
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

    it('adds multichain token search result to history', () => {
      const state = searchHistoryReducer(
        initialSearchHistoryState,
        addToSearchHistory({
          searchResult: {
            type: SearchHistoryResultType.MultichainToken,
            multichainId: 'mc:usdc',
            name: 'USD Coin',
            symbol: 'USDC',
            tokenCurrencyIds: [buildCurrencyId(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')],
          },
        }),
      )

      expect(state.results).toHaveLength(1)
      expect(state.results[0]).toMatchObject({
        type: SearchHistoryResultType.MultichainToken,
        multichainId: 'mc:usdc',
        symbol: 'USDC',
      })
    })

    it('rejects multichain token search result with empty tokenCurrencyIds', () => {
      const state = searchHistoryReducer(
        initialSearchHistoryState,
        addToSearchHistory({
          searchResult: {
            type: SearchHistoryResultType.MultichainToken,
            multichainId: 'mc:empty',
            name: 'X',
            symbol: 'X',
            tokenCurrencyIds: [],
          },
        }),
      )

      expect(state.results).toHaveLength(0)
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

    it('moves a re-searched result to the front without duplicating it', () => {
      const state = addAll([WALLET_RESULT, token(0), WALLET_RESULT])

      expect(state.results.map((r) => r.type)).toEqual([
        SearchHistoryResultType.WalletByAddress,
        SearchHistoryResultType.Token,
      ])
    })

    it('caps each type separately so token searches do not evict pool or wallet recents', () => {
      const state = addAll([WALLET_RESULT, POOL_RESULT, ...range(40).map(token)])

      const tokens = state.results.filter((r) => r.type === SearchHistoryResultType.Token)
      expect(tokens).toHaveLength(30)
      expect(tokens[0]).toMatchObject({ address: tokenAddress(39) })
      expect(state.results.filter((r) => r.type === SearchHistoryResultType.Pool)).toHaveLength(1)
      expect(state.results.filter((r) => r.type === SearchHistoryResultType.WalletByAddress)).toHaveLength(1)
    })

    it('keeps adding when persisted history holds an unrecognized type', () => {
      const unknownEntry = { type: 99, searchId: 'unknown-1' } as unknown as SearchHistoryResult

      const state = searchHistoryReducer({ results: [unknownEntry] }, addToSearchHistory({ searchResult: token(0) }))

      expect(state.results).toEqual([expect.objectContaining({ address: tokenAddress(0) }), unknownEntry])
    })

    it('counts token and multichain token results against the same cap', () => {
      const state = addAll(range(20).flatMap((i) => [token(i), multichainToken(i)]))

      expect(state.results).toHaveLength(30)
      expect(state.results[0]).toMatchObject({ multichainId: 'mc:19' })
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
