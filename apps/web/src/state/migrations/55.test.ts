import { PreV55SearchResultType } from 'uniswap/src/state/oldTypes'
import { migration55 } from '~/state/migrations/55'

const previousState = {
  _persist: {
    version: 54,
    rehydrated: true,
  },
  searchHistory: {
    results: [
      {
        type: PreV55SearchResultType.Token as const,
        chainId: 1,
        symbol: 'ETH',
        address: null,
        name: 'Ethereum',
        logoUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
        searchId: 'token-1-null',
      },
    ],
  },
}

describe('migration to v55', () => {
  it('should migrate search history and update persist version', () => {
    const result = migration55(previousState)
    expect(result?._persist.version).toEqual(55)
    expect(result?.searchHistory?.results).toBeDefined()
  })

  it('should handle undefined state', () => {
    const result = migration55(undefined)
    expect(result).toBeUndefined()
  })

  it('should handle missing searchHistory gracefully', () => {
    const stateWithoutSearchHistory = {
      _persist: {
        version: 54,
        rehydrated: true,
      },
    }

    const result = migration55(stateWithoutSearchHistory)
    expect(result?._persist.version).toEqual(55)
  })
})
