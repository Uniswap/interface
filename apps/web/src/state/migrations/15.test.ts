import { createMigrate } from 'redux-persist'
import { migration1 } from 'state/migrations/1'
import { migration2 } from 'state/migrations/2'
import { migration3 } from 'state/migrations/3'
import { migration4 } from 'state/migrations/4'
import { migration5 } from 'state/migrations/5'
import { migration6 } from 'state/migrations/6'
import { migration7 } from 'state/migrations/7'
import { migration8 } from 'state/migrations/8'
import { migration9 } from 'state/migrations/9'
import { migration10 } from 'state/migrations/10'
import { migration11 } from 'state/migrations/11'
import { migration12 } from 'state/migrations/12'
import { migration13 } from 'state/migrations/13'
import { migration14 } from 'state/migrations/14'
import { migration15, PersistAppStateV15 } from 'state/migrations/15'

const previousState: PersistAppStateV15 = {
  _persist: {
    version: 14,
    rehydrated: true,
  },
}

const migrator = createMigrate(
  {
    1: migration1,
    2: migration2,
    3: migration3,
    4: migration4,
    5: migration5,
    6: migration6,
    7: migration7,
    8: migration8,
    9: migration9,
    10: migration10,
    11: migration11,
    12: migration12,
    13: migration13,
    14: migration14,
    15: migration15,
  },
  { debug: false },
)

describe('migration to v15', () => {
  it('should set searchHistory object', async () => {
    const result: any = await migrator(previousState, 15)
    expect(result.searchHistory).toMatchObject({
      results: [],
    })
  })

  it('migrates recentlySearchedAssets atom to searchHistory', async () => {
    localStorage.setItem(
      'recentlySearchedAssetsV3',
      JSON.stringify([
        {
          type: 1,
          chain: 'POLYGON',
          chainId: 137,
          symbol: 'MATIC',
          address: '0x0000000000000000000000000000000000001010',
          name: 'Polygon',
          isToken: false,
          isNative: false,
          logoUrl: 'https://coin-images.coingecko.com/coins/images/4713/large/polygon.png?1698233745',
        },
        {
          type: 1,
          chain: 'ETHEREUM',
          chainId: 1,
          symbol: 'MATIC',
          address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
          name: 'Matic Token',
          isToken: true,
          isNative: false,
          logoUrl: 'https://coin-images.coingecko.com/coins/images/4713/large/polygon.png?1698233745',
        },
        {
          type: 1,
          chain: 'ETHEREUM',
          chainId: 1,
          symbol: 'USDC',
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          name: 'USD Coin',
          isToken: true,
          isNative: false,
          logoUrl: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
        },
        {
          type: 1,
          chain: 'ETHEREUM',
          chainId: 1,
          symbol: 'ETH',
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          name: 'Ethereum',
          isToken: false,
          isNative: true,
          logoUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
        },
      ]),
    )

    const result: any = await migrator(previousState, 15)

    expect(result.searchHistory.results).toEqual([
      {
        address: '0x0000000000000000000000000000000000001010',
        chainId: 137,
        logoUrl: 'https://coin-images.coingecko.com/coins/images/4713/large/polygon.png?1698233745',
        name: 'Polygon',
        symbol: 'MATIC',
        type: 1,
      },
      {
        address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
        chainId: 1,
        logoUrl: 'https://coin-images.coingecko.com/coins/images/4713/large/polygon.png?1698233745',
        name: 'Matic Token',
        symbol: 'MATIC',
        type: 1,
      },
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        chainId: 1,
        logoUrl: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
        name: 'USD Coin',
        symbol: 'USDC',
        type: 1,
      },
      {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        chainId: 1,
        logoUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
        name: 'Ethereum',
        symbol: 'ETH',
        type: 1,
      },
    ])
  })
})
