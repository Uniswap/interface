import { createMigrate } from 'redux-persist'

import { migration1 } from './1'
import { migration2 } from './2'
import { migration3, PersistAppStateV3 } from './3'

const previousState: PersistAppStateV3 = {
  lists: {
    lastInitializedDefaultListOfLists: [
      'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
      'https://gateway.ipfs.io/ipns/extendedtokens.uniswap.org',
      'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
      'tokenlist.aave.eth',
      'https://tokens.coingecko.com/uniswap/all.json',
      'https://tokens.coingecko.com/binance-smart-chain/all.json',
      'https://tokens.coingecko.com/arbitrum-one/all.json',
      'https://tokens.coingecko.com/optimistic-ethereum/all.json',
      'https://tokens.coingecko.com/celo/all.json',
      'https://tokens.coingecko.com/polygon-pos/all.json',
      'https://tokens.coingecko.com/avalanche/all.json',
      't2crtokens.eth',
      'https://www.gemini.com/uniswap/manifest.json',
      'wrapped.tokensoft.eth',
      'https://raw.githubusercontent.com/SetProtocol/uniswap-tokenlist/main/set.tokenlist.json',
      'https://bridge.arbitrum.io/token-list-42161.json',
      'https://static.optimism.io/optimism.tokenlist.json',
      'https://celo-org.github.io/celo-token-list/celo.tokenlist.json',
      'https://raw.githubusercontent.com/plasmadlt/plasma-finance-token-list/master/bnb.json',
      'https://raw.githubusercontent.com/ava-labs/avalanche-bridge-resources/main/token_list.json',
      'https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/master/optimism.tokenlist.json',
      'https://raw.githubusercontent.com/The-Blockchain-Association/sec-notice-list/master/ba-sec-list.json',
      'https://gateway.ipfs.io/ipns/unsupportedtokens.uniswap.org',
    ],
    // dummy byUrl to test migration
    byUrl: {
      'https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/master/optimism.tokenlist.json':
        {
          current: {
            name: 'Superchain Token List',
            logoURI: 'https://ethereum-optimism.github.io/optimism.svg',
            keywords: ['scaling', 'layer2', 'infrastructure'],
            timestamp: '2023-10-31T22:05:31.613Z',
            tokens: [
              {
                chainId: 1,
                address: '0xb6ed7644c69416d67b522e20bc294a9a9b405b31',
                name: '0xBitcoin',
                symbol: '0xBTC',
                decimals: 8,
                logoURI: 'https://ethereum-optimism.github.io/data/0xBTC/logo.png',
                extensions: {
                  optimismBridgeAddress: '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1',
                  opListId: 'extended',
                  opTokenId: '0xBTC',
                },
              },
            ],
            version: {
              major: 9,
              minor: 0,
              patch: 1,
            },
          },
          pendingUpdate: null,
          loadingRequestId: null,
          error: null,
        },
    },
  },
  _persist: {
    version: 2,
    rehydrated: true,
  },
}

describe('migration to v3', () => {
  it('should migrate all users to empty initial list state', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
      },
      { debug: false }
    )
    const result: any = await migrator(previousState, 3)
    expect(result?.lists).toBeUndefined()
    expect(result?._persist.version).toEqual(3)
  })
})
