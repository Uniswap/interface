import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { describe, expect, it } from 'vitest'
import {
  getXProfileUrl,
  mergeAuctionTokenMetadata,
  resolveAuctionTokenLogo,
} from '~/features/Toucan/Auction/utils/tokenMetadata'

describe('getXProfileUrl', () => {
  it('builds the profile URL from a bare handle', () => {
    expect(getXProfileUrl('uniswap')).toBe('https://x.com/uniswap')
    expect(getXProfileUrl('a_1')).toBe('https://x.com/a_1')
  })

  it('returns undefined for malformed handles so the badge is hidden', () => {
    // path/query injection — would otherwise resolve to an arbitrary x.com path
    expect(getXProfileUrl('intent/follow?screen_name=evil')).toBeUndefined()
    expect(getXProfileUrl('uniswap/../evil')).toBeUndefined()
    expect(getXProfileUrl('')).toBeUndefined()
    // too long (X handles are <= 15 chars)
    expect(getXProfileUrl('a'.repeat(16))).toBeUndefined()
  })
})

describe('mergeAuctionTokenMetadata', () => {
  it('returns undefined when there is no override and no API metadata (sections stay hidden)', () => {
    expect(
      mergeAuctionTokenMetadata({ override: undefined, tokenDescription: undefined, xHandle: undefined }),
    ).toBeUndefined()
  })

  it('fills description and twitter from API fields when there is no override', () => {
    const result = mergeAuctionTokenMetadata({
      override: undefined,
      tokenDescription: 'A launched token',
      xHandle: 'sometoken',
    })

    expect(result).toEqual({
      description: 'A launched token',
      twitter: 'https://x.com/sometoken',
    })
  })

  it('keeps API-provided description hidden when unset even if other override fields exist', () => {
    const result = mergeAuctionTokenMetadata({
      override: { website: 'https://example.com' },
      tokenDescription: undefined,
      xHandle: undefined,
    })

    expect(result).toEqual({
      website: 'https://example.com',
      description: undefined,
      twitter: undefined,
    })
  })

  it('prefers config override values over API fields (override is authoritative)', () => {
    const result = mergeAuctionTokenMetadata({
      override: {
        description: 'Curated description',
        twitter: 'https://x.com/curated',
        website: 'https://example.com',
      },
      tokenDescription: 'API description',
      xHandle: 'apihandle',
    })

    expect(result).toEqual({
      description: 'Curated description',
      twitter: 'https://x.com/curated',
      website: 'https://example.com',
    })
  })

  it('fills only the gaps the override leaves with API fields', () => {
    // Override has twitter but no description → override twitter wins, API description fills the gap.
    expect(
      mergeAuctionTokenMetadata({
        override: { twitter: 'https://x.com/curated' },
        tokenDescription: 'API description',
        xHandle: 'apihandle',
      }),
    ).toEqual({
      description: 'API description',
      twitter: 'https://x.com/curated',
    })

    // Override has description but no twitter → override description wins, API handle fills the gap.
    expect(
      mergeAuctionTokenMetadata({
        override: { description: 'Curated description' },
        tokenDescription: undefined,
        xHandle: 'apihandle',
      }),
    ).toEqual({
      description: 'Curated description',
      twitter: 'https://x.com/apihandle',
    })
  })
})

describe('resolveAuctionTokenLogo', () => {
  const tokenInfoWithoutLogo = { currencyId: '1-0xabc', logoUrl: null } as unknown as CurrencyInfo
  const tokenInfoWithLogo = { currencyId: '1-0xabc', logoUrl: 'https://indexed.example/logo.png' } as CurrencyInfo
  const API_IMAGE = 'https://api.example/image.png'
  const OVERRIDE_LOGO = 'https://override.example/logo.png'

  it('returns undefined token info unchanged', () => {
    expect(
      resolveAuctionTokenLogo({ tokenInfo: undefined, overrideLogoUrl: OVERRIDE_LOGO, tokenImageUrl: API_IMAGE }),
    ).toBeUndefined()
  })

  it('prefers the config override over the API image and the indexed logo', () => {
    expect(
      resolveAuctionTokenLogo({
        tokenInfo: tokenInfoWithLogo,
        overrideLogoUrl: OVERRIDE_LOGO,
        tokenImageUrl: API_IMAGE,
      }),
    ).toEqual({ ...tokenInfoWithLogo, logoUrl: OVERRIDE_LOGO })
  })

  it('prefers the API image over the indexed logo when there is no override', () => {
    expect(
      resolveAuctionTokenLogo({ tokenInfo: tokenInfoWithLogo, overrideLogoUrl: undefined, tokenImageUrl: API_IMAGE }),
    ).toEqual({ ...tokenInfoWithLogo, logoUrl: API_IMAGE })
  })

  it('keeps the indexed logo when neither override nor API image is present', () => {
    expect(
      resolveAuctionTokenLogo({ tokenInfo: tokenInfoWithLogo, overrideLogoUrl: undefined, tokenImageUrl: undefined }),
    ).toBe(tokenInfoWithLogo)
  })

  it('leaves a logoless token unchanged so the TokenLogo placeholder renders', () => {
    expect(
      resolveAuctionTokenLogo({
        tokenInfo: tokenInfoWithoutLogo,
        overrideLogoUrl: undefined,
        tokenImageUrl: undefined,
      }),
    ).toBe(tokenInfoWithoutLogo)
  })

  it('fills the logo from the API image when the token has no logo', () => {
    expect(
      resolveAuctionTokenLogo({
        tokenInfo: tokenInfoWithoutLogo,
        overrideLogoUrl: undefined,
        tokenImageUrl: API_IMAGE,
      }),
    ).toEqual({ ...tokenInfoWithoutLogo, logoUrl: API_IMAGE })
  })
})
