import { findRWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import type { RWAAsset, RWAWhitelist, RWAToken } from 'uniswap/src/features/rwa/types'

const MAINNET_CHAIN_ID = 1
const BNB_CHAIN_ID = 56
const SOLANA_CHAIN_ID = 501000101
const TSLA_MAINNET_ADDRESS = '0xf6b1117ec07684D3958caD8BEb1b302bfD21103f'
const TSLA_MAINNET_ADDRESS_LOWERCASE = '0xf6b1117ec07684d3958cad8beb1b302bfd21103f'
const TSLA_BNB_ADDRESS = '0x2494b603319d4d9f9715c9f4496d9e0364b59d93'
const TSLA_SOLANA_ADDRESS = 'KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo'
const TSLA_SOLANA_ADDRESS_CASE_MISMATCH = 'keGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo'

const TSLA_TOKEN: RWAToken = {
  chainId: MAINNET_CHAIN_ID,
  address: TSLA_MAINNET_ADDRESS,
  issuer: 'ondo',
}

const TSLA_ASSET: RWAAsset = {
  symbol: 'TSLA',
  icon: 'https://example.com/tesla.png',
  tokens: [TSLA_TOKEN],
}

const RWA_WHITELIST: RWAWhitelist = [TSLA_ASSET]

describe(findRWAMatch, () => {
  it('matches the first matching candidate', () => {
    const match = findRWAMatch({
      rwaWhitelist: RWA_WHITELIST,
      candidates: [
        {
          chainId: MAINNET_CHAIN_ID,
          address: TSLA_MAINNET_ADDRESS_LOWERCASE,
        },
      ],
    })

    expect(match).toEqual({
      asset: TSLA_ASSET,
      token: TSLA_TOKEN,
    })
  })

  it('checks later candidates when earlier candidates do not match', () => {
    const match = findRWAMatch({
      rwaWhitelist: RWA_WHITELIST,
      candidates: [
        {
          chainId: BNB_CHAIN_ID,
          address: TSLA_BNB_ADDRESS,
        },
        {
          chainId: MAINNET_CHAIN_ID,
          address: TSLA_MAINNET_ADDRESS,
        },
      ],
    })

    expect(match?.asset.symbol).toBe('TSLA')
    expect(match?.token.issuer).toBe('ondo')
  })

  it('does not match when the address is on a different chain', () => {
    const match = findRWAMatch({
      rwaWhitelist: RWA_WHITELIST,
      candidates: [{ chainId: BNB_CHAIN_ID, address: TSLA_MAINNET_ADDRESS }],
    })

    expect(match).toBeUndefined()
  })

  it('keeps non-EVM token addresses case-sensitive', () => {
    const rwaWhitelist: RWAWhitelist = [
      {
        symbol: 'TSLA',
        icon: 'https://example.com/tesla.png',
        tokens: [
          {
            chainId: SOLANA_CHAIN_ID,
            address: TSLA_SOLANA_ADDRESS,
            issuer: 'ondo',
          },
        ],
      },
    ]

    const match = findRWAMatch({
      rwaWhitelist,
      candidates: [{ chainId: SOLANA_CHAIN_ID, address: TSLA_SOLANA_ADDRESS_CASE_MISMATCH }],
    })

    expect(match).toBeUndefined()
  })
})
