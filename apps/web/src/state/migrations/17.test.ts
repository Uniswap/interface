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
import { migration15 } from 'state/migrations/15'
import { migration16 } from 'state/migrations/16'
import { migration17, PersistAppStateV17 } from 'state/migrations/17'
import { PreV55SearchResultType } from 'uniswap/src/state/oldTypes'

const previousState: PersistAppStateV17 = {
  _persist: {
    version: 16,
    rehydrated: true,
  },
  searchHistory: {
    results: [
      // token selector saved native asset
      {
        type: PreV55SearchResultType.Token,
        chainId: 1,
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        name: 'Ethereum',
        symbol: 'ETH',
        logoUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
        searchId: 'token-1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      },
      // navbar saved native asset
      {
        type: PreV55SearchResultType.Token,
        chainId: 1,
        symbol: 'ETH',
        address: null,
        name: 'Ethereum',
        logoUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
        searchId: 'token-1-null',
      },
      // token selector saved token
      {
        type: PreV55SearchResultType.Token,
        chainId: 42161,
        symbol: 'USDC',
        address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        name: 'USD Coin',
        logoUrl: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
        searchId: 'token-42161-0xaf88d065e77c8cc2239327c5edb3a432268e5831',
      },
      // navbar saved nft collection
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
    ],
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
    16: migration16,
    17: migration17,
  },
  { debug: false },
)

describe('migration to v17', () => {
  it('migrates potentially invalid searchHistory', async () => {
    const result: any = await migrator(previousState, 17)
    expect(result.searchHistory.results).toEqual([
      {
        type: PreV55SearchResultType.Token,
        chainId: 1,
        symbol: 'ETH',
        address: null,
        name: 'Ethereum',
        logoUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
        searchId: 'token-1-null',
      },
      {
        type: PreV55SearchResultType.Token,
        chainId: 42161,
        symbol: 'USDC',
        address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        name: 'USD Coin',
        logoUrl: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
        searchId: 'token-42161-0xaf88d065e77c8cc2239327c5edb3a432268e5831',
      },
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
    ])
  })
})
