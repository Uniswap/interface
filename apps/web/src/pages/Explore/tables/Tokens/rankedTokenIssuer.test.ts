import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { RWAAsset } from 'uniswap/src/features/rwa/types'
import { UNKNOWN_RWA_ISSUER } from 'uniswap/src/features/rwa/types'
import { findRankedTokenRWAMatch } from '~/pages/Explore/tables/Tokens/rankedTokenIssuer'

const MAINNET_ADDRESS = '0x1111111111111111111111111111111111111111'
const BASE_ADDRESS = '0x2222222222222222222222222222222222222222'

function makeAsset(issuer: string): RWAAsset {
  return {
    symbol: 'TSLA',
    name: 'Tesla',
    icon: '',
    category: RwaCategory.STOCKS,
    tokens: [{ chainId: 1, address: MAINNET_ADDRESS, issuer, name: 'Tesla', symbol: 'TSLAon', logoUrl: '' }],
  }
}

function makeToken(addresses: Record<string, string>): NonNullable<RankedMultichainToken['multichainToken']> {
  return { addresses } as unknown as NonNullable<RankedMultichainToken['multichainToken']>
}

describe('findRankedTokenRWAMatch', () => {
  it('matches the registry through a non-primary deployment', () => {
    const match = findRankedTokenRWAMatch({
      multichainToken: makeToken({ '8453': BASE_ADDRESS, '1': MAINNET_ADDRESS }),
      rwaWhitelist: [makeAsset('ondo')],
    })
    expect(match?.token.issuer).toBe('ondo')
    expect(match?.asset.name).toBe('Tesla')
  })

  it('returns undefined for a token that is not in the registry', () => {
    const match = findRankedTokenRWAMatch({
      multichainToken: makeToken({ '8453': BASE_ADDRESS }),
      rwaWhitelist: [makeAsset('ondo')],
    })
    expect(match).toBeUndefined()
  })

  it('returns undefined for an issuer-less registry entry', () => {
    const match = findRankedTokenRWAMatch({
      multichainToken: makeToken({ '1': MAINNET_ADDRESS }),
      rwaWhitelist: [makeAsset(UNKNOWN_RWA_ISSUER)],
    })
    expect(match).toBeUndefined()
  })
})
