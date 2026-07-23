import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { mapRankedRwa } from 'uniswap/src/data/rest/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/rest/rwa/rankedRwaTestHelpers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { describe, expect, it } from 'vitest'
import { filterRwaRowsBySearch } from '~/pages/Explore/rwa/table/filterRwaRowsBySearch'

describe('filterRwaRowsBySearch', () => {
  const row =
    mapRankedRwa({
      token: makeRankedRwa({
        symbol: 'TSLA',
        name: 'Tesla',
        issuerTokens: [
          {
            symbol: 'TSLAON',
            issuer: 'ondo',
            name: 'Tesla Ondo',
            chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0xondo1' }],
          },
        ],
      }),
      category: RwaCategory.STOCKS,
    }) ??
    (() => {
      throw new Error('expected row')
    })()

  it('returns all rows when query is empty', () => {
    expect(filterRwaRowsBySearch([row], '  ')).toEqual([row])
  })

  it('matches symbol, name, and issuer fields', () => {
    expect(filterRwaRowsBySearch([row], 'tsla')).toEqual([row])
    expect(filterRwaRowsBySearch([row], 'tesla')).toEqual([row])
    expect(filterRwaRowsBySearch([row], 'ondo')).toEqual([row])
    expect(filterRwaRowsBySearch([row], 'nope')).toEqual([])
  })
})
