import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getRWAHeaderIdentity } from 'src/components/TokenDetails/getRWAHeaderIdentity'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'

// Shared canonical asset ("group") icon — identical across every issuer of NVDA; must never be the header logo.
const GROUP_ICON = 'https://example.com/nvda-group.png'
const TOKEN_PROJECT_LOGO = 'https://example.com/nvda-robinhood.png'

const ROBINHOOD_NVDA_MATCH: RWAMatch = {
  asset: {
    symbol: 'NVDA',
    name: 'NVIDIA',
    icon: GROUP_ICON,
    tokens: [],
    category: 0 as RwaCategory, // unused by getRWAHeaderIdentity
  },
  token: {
    chainId: 1,
    address: '0x0000000000000000000000000000000000000001',
    issuer: 'robinhood',
    name: 'NVIDIA',
    symbol: 'NVDA',
    logoUrl: 'https://example.com/nvda-robinhood-issuer.png',
  },
}

describe('getRWAHeaderIdentity', () => {
  it('keeps the matched token logo (not the shared group icon) for an RWA match [CONS-2543]', () => {
    const { logoUrl } = getRWAHeaderIdentity({
      rwaMatch: ROBINHOOD_NVDA_MATCH,
      fallbackName: 'ignored',
      logoUrl: TOKEN_PROJECT_LOGO,
    })

    expect(logoUrl).toBe(TOKEN_PROJECT_LOGO)
    expect(logoUrl).not.toBe(GROUP_ICON)
  })

  it('shows the underlying asset name for an RWA match', () => {
    const { name } = getRWAHeaderIdentity({
      rwaMatch: ROBINHOOD_NVDA_MATCH,
      fallbackName: 'ignored',
      logoUrl: TOKEN_PROJECT_LOGO,
    })

    expect(name).toBe('NVIDIA')
  })

  it('falls back to the asset symbol when the RWA asset name is empty', () => {
    const { name } = getRWAHeaderIdentity({
      rwaMatch: { ...ROBINHOOD_NVDA_MATCH, asset: { ...ROBINHOOD_NVDA_MATCH.asset, name: '' } },
      fallbackName: 'ignored',
      logoUrl: TOKEN_PROJECT_LOGO,
    })

    expect(name).toBe('NVDA')
  })

  it('uses the fallback name and project logo when there is no RWA match', () => {
    const result = getRWAHeaderIdentity({
      rwaMatch: undefined,
      fallbackName: 'USD Coin',
      logoUrl: TOKEN_PROJECT_LOGO,
    })

    expect(result).toEqual({ name: 'USD Coin', logoUrl: TOKEN_PROJECT_LOGO })
  })
})
