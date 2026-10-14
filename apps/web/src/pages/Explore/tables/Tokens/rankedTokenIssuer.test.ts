import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { RankedMultichainToken, TokenIssuerInfo } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { RWAAsset } from 'uniswap/src/features/rwa/types'
import { UNKNOWN_RWA_ISSUER } from 'uniswap/src/features/rwa/types'
import { resolveRankedTokenIssuer } from '~/pages/Explore/tables/Tokens/rankedTokenIssuer'

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

function makeToken(
  addresses: Record<string, string>,
  issuer?: Partial<TokenIssuerInfo>,
): NonNullable<RankedMultichainToken['multichainToken']> {
  return { addresses, issuer } as unknown as NonNullable<RankedMultichainToken['multichainToken']>
}

describe('resolveRankedTokenIssuer', () => {
  it('matches the registry through a non-primary deployment', () => {
    const { rwaMatch, issuer } = resolveRankedTokenIssuer({
      multichainToken: makeToken({ '8453': BASE_ADDRESS, '1': MAINNET_ADDRESS }),
      rwaWhitelist: [makeAsset('ondo')],
    })
    expect(issuer?.issuer).toBe('ondo')
    expect(rwaMatch?.asset.name).toBe('Tesla')
  })

  it('keeps the registry slug but takes display name and logo from the backend issuer', () => {
    const { rwaMatch, issuer } = resolveRankedTokenIssuer({
      multichainToken: makeToken(
        { '1': MAINNET_ADDRESS },
        { id: 'coingecko-ondo', displayName: 'Ondo Finance', logoUrl: 'https://logo/ondo.png' },
      ),
      rwaWhitelist: [makeAsset('ondo')],
    })
    expect(rwaMatch).toBeDefined()
    expect(issuer).toEqual({
      issuer: 'ondo',
      issuerDisplayName: 'Ondo Finance',
      issuerLogoUrl: 'https://logo/ondo.png',
    })
  })

  it('falls back to the backend issuer for a token outside the registry', () => {
    const { rwaMatch, issuer } = resolveRankedTokenIssuer({
      multichainToken: makeToken(
        { '1': BASE_ADDRESS },
        { id: 'coingecko-tether-ecosystem', displayName: 'Tether', logoUrl: 'https://logo' },
      ),
      rwaWhitelist: [makeAsset('ondo')],
    })
    expect(rwaMatch).toBeUndefined()
    expect(issuer).toEqual({
      issuer: 'coingecko-tether-ecosystem',
      issuerDisplayName: 'Tether',
      issuerLogoUrl: 'https://logo',
    })
  })

  it('keeps the registry match but takes the backend issuer for an issuer-less registry entry', () => {
    const { rwaMatch, issuer } = resolveRankedTokenIssuer({
      multichainToken: makeToken({ '1': MAINNET_ADDRESS }, { id: 'paxos' }),
      rwaWhitelist: [makeAsset(UNKNOWN_RWA_ISSUER)],
    })
    expect(rwaMatch?.asset.name).toBe('Tesla')
    expect(issuer?.issuer).toBe('paxos')
  })

  it('resolves no issuer for an issuer-less registry entry with no backend issuer', () => {
    const { rwaMatch, issuer } = resolveRankedTokenIssuer({
      multichainToken: makeToken({ '1': MAINNET_ADDRESS }),
      rwaWhitelist: [makeAsset(UNKNOWN_RWA_ISSUER)],
    })
    expect(rwaMatch).toBeDefined()
    expect(issuer).toBeUndefined()
  })

  it('resolves nothing for a plain token', () => {
    expect(
      resolveRankedTokenIssuer({
        multichainToken: makeToken({ '8453': BASE_ADDRESS }),
        rwaWhitelist: [makeAsset('ondo')],
      }),
    ).toEqual({})
  })
})
