/* biome-ignore-all lint/suspicious/noExplicitAny: legacy code needs review */
import { SearchHistoryResultType } from 'uniswap/src/features/search/SearchHistoryResult'
import { PreV55SearchResultType } from 'uniswap/src/state/oldTypes'
import { migrateSearchHistory, removeThaiBahtFromFiatCurrency } from 'uniswap/src/state/uniswapMigrations'

// Mobile: 89
// Extension: 25
// Web: 25
it('removes THB from fiat currency', () => {
  const state = {
    userSettings: {
      currentCurrency: 'THB',
    },
  }
  const newState = removeThaiBahtFromFiatCurrency(state)
  expect(newState.userSettings.currentCurrency).toEqual('USD')

  const stateWithJPY = {
    userSettings: {
      currentCurrency: 'JPY',
    },
  }
  const newStateWithJPY = removeThaiBahtFromFiatCurrency(stateWithJPY)
  expect(newStateWithJPY.userSettings.currentCurrency).toEqual('JPY')
})

// Web: 55
// Mobile: 93
// Extension: 27

describe('migrateSearchHistory', () => {
  const createPreviousState = (): any => ({
    _persist: {
      version: 53,
      rehydrated: true,
    },
    searchHistory: {
      results: [
        // ENS Address (should be converted into WalletByAddress)
        {
          type: PreV55SearchResultType.ENSAddress,
          address: '0x1234567890123456789012345678901234567890',
          ensName: 'vitalik.eth',
          searchId: 'ensAddress-vitalik.eth',
        },
        // Token with extra fields that should be removed
        {
          type: PreV55SearchResultType.Token,
          chainId: 1,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          name: 'USD Coin',
          symbol: 'USDC',
          logoUrl: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
          searchId: 'token-1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        },
        // Native token with extra fields
        {
          type: PreV55SearchResultType.Token,
          chainId: 1,
          address: null,
          name: 'Ethereum',
          symbol: 'ETH',
          logoUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
          searchId: 'token-1-null',
        },
        // Etherscan result
        {
          type: PreV55SearchResultType.Etherscan,
          address: '0x1234567890123456789012345678901234567890',
          searchId: 'etherscan-0x1234567890123456789012345678901234567890',
        },
        // NFT collection (should remain unchanged except type value)
        {
          type: PreV55SearchResultType.NFTCollection,
          chainId: 1,
          address: '0xbd3531da5cf5857e7cfaa92426877b022e612cf8',
          name: 'Pudgy Penguins',
          imageUrl:
            'https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4o31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqg7RFi?w=500&auto=format',
          isVerified: true,
          searchId: 'nftCollection-1-0xbd3531da5cf5857e7cfaa92426877b022e612cf8',
        },
        // Unitag (should be converted into WalletByAddress)
        {
          type: PreV55SearchResultType.Unitag,
          address: '0xhayden123456',
          unitag: 'hayden.eth',
          searchId: 'unitag-hayden',
        },
        // Wallet address (should remain unchanged except type value)
        {
          type: PreV55SearchResultType.WalletByAddress,
          address: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
          searchId: 'wallet-0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
        },
        // Pool result
        {
          type: PreV55SearchResultType.Pool,
          chainId: 1,
          poolId: 'pool-1-0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
          protocolVersion: 2,
          feeTier: 3000,
          token0CurrencyId: '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          token1CurrencyId: '1-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          searchId: 'pool-1-0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
        },
      ],
    },
  })

  it('verifies correct enum mapping', () => {
    const prevState = createPreviousState()
    const result = migrateSearchHistory(prevState)

    // Verify ENSAddress and Unitag are converted to WalletByAddress
    // Should still have 8 results after conversion
    expect(result?.searchHistory.results.length).toBe(8)

    // Verify enum values are correctly mapped
    expect(result?.searchHistory.results[0].type).toBe(3) // ENSAddress -> WalletByAddress
    expect(result?.searchHistory.results[1].type).toBe(0) // Token
    expect(result?.searchHistory.results[2].type).toBe(0) // Token
    expect(result?.searchHistory.results[3].type).toBe(1) // Etherscan
    expect(result?.searchHistory.results[4].type).toBe(2) // NFTCollection
    expect(result?.searchHistory.results[5].type).toBe(3) // Unitag -> WalletByAddress
    expect(result?.searchHistory.results[6].type).toBe(3) // WalletByAddress
    expect(result?.searchHistory.results[7].type).toBe(4) // Pool
  })

  it('handles enum reordering and removes dynamic fields from TokenSearchHistoryResult', () => {
    const prevState = createPreviousState()
    const result = migrateSearchHistory(prevState)

    expect(result?.searchHistory.results).toEqual([
      // ENSAddress converted to WalletByAddress
      {
        type: SearchHistoryResultType.WalletByAddress, // 3
        address: '0x1234567890123456789012345678901234567890',
        searchId: 'wallet-0x1234567890123456789012345678901234567890',
      },
      // Tokens should have new type value (1 → 0) and only have type, chainId, address, and searchId
      {
        type: SearchHistoryResultType.Token, // 0
        chainId: 1,
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        searchId: 'token-1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      },
      {
        type: SearchHistoryResultType.Token, // 0
        chainId: 1,
        address: null,
        searchId: 'token-1-null',
      },
      // Etherscan should have new type value (2 → 1)
      {
        type: SearchHistoryResultType.Etherscan, // 1
        address: '0x1234567890123456789012345678901234567890',
        searchId: 'etherscan-0x1234567890123456789012345678901234567890',
      },
      // NFT collection should have new type value (3 → 2)
      {
        type: SearchHistoryResultType.NFTCollection, // 2
        chainId: 1,
        address: '0xbd3531da5cf5857e7cfaa92426877b022e612cf8',
        name: 'Pudgy Penguins',
        imageUrl:
          'https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4o31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqg7RFi?w=500&auto=format',
        isVerified: true,
        searchId: 'nftCollection-1-0xbd3531da5cf5857e7cfaa92426877b022e612cf8',
      },
      // Unitag converted to WalletByAddress
      {
        type: SearchHistoryResultType.WalletByAddress, // 3
        address: '0xhayden123456',
        searchId: 'wallet-0xhayden123456',
      },
      // Wallet address should have new type value (5 → 3)
      {
        type: SearchHistoryResultType.WalletByAddress, // 3
        address: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
        searchId: 'wallet-0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
      },
      // Pool should have new type value (6 → 4)
      {
        type: SearchHistoryResultType.Pool, // 4
        chainId: 1,
        poolId: 'pool-1-0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
        protocolVersion: 2,
        hookAddress: undefined,
        feeTier: 3000,
        token0CurrencyId: '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        token1CurrencyId: '1-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        searchId: 'pool-1-0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
      },
    ])
  })

  it('handles empty search history', () => {
    const emptyState = {
      _persist: {
        version: 53,
        rehydrated: true,
      },
      searchHistory: { results: [] },
    }
    const result = migrateSearchHistory(emptyState)
    expect(result?.searchHistory.results).toEqual([])
  })

  it('handles missing search history', () => {
    const stateWithoutSearchHistory = {
      _persist: {
        version: 53,
        rehydrated: true,
      },
    }
    const result = migrateSearchHistory(stateWithoutSearchHistory)
    expect(result?.searchHistory).toBeUndefined()
  })

  it('should handle undefined state', () => {
    const result = migrateSearchHistory({})
    expect(result).toEqual({})
  })
})
