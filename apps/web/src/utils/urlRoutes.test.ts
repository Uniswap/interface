import { InterfacePageName } from '@uniswap/analytics-events'

import { getCanonicalUrl, getCurrentPageFromLocation } from './urlRoutes'

describe('getCurrentPageFromLocation', () => {
  it('should return SWAP_PAGE when location pathname starts with "/swap"', () => {
    const result = getCurrentPageFromLocation('/swap/123')
    expect(result).toBe(InterfacePageName.SWAP_PAGE)
  })

  it('should return TOKEN_DETAILS_PAGE when location pathname starts with "/explore/tokens/:chainName/0x"', () => {
    let result = getCurrentPageFromLocation('/explore/tokens/optimism/0x123')
    expect(result).toBe(InterfacePageName.TOKEN_DETAILS_PAGE)

    result = getCurrentPageFromLocation('/explore/tokens/polygon/NATIVE')
    expect(result).toBe(InterfacePageName.TOKEN_DETAILS_PAGE)
  })

  it('should return POOL_DETAILS_PAGE when location pathname starts with "/explore/pools/0x"', () => {
    const result = getCurrentPageFromLocation('/explore/pools/optimism/0x456')
    expect(result).toBe(InterfacePageName.POOL_DETAILS_PAGE)
  })

  it('should return EXPLORE_PAGE when location pathname starts with "/explore" but does not match detail-page routes', () => {
    let result = getCurrentPageFromLocation('/explore/tokens/ethereum')
    expect(result).toBe(InterfacePageName.EXPLORE_PAGE)

    result = getCurrentPageFromLocation('/explore/pools/optimism')
    expect(result).toBe(InterfacePageName.EXPLORE_PAGE)
  })

  it('should return VOTE_PAGE when location pathname starts with "/vote"', () => {
    const result = getCurrentPageFromLocation('/vote/456')
    expect(result).toBe(InterfacePageName.VOTE_PAGE)
  })

  it('should return POOL_PAGE when location pathname starts with "/pools" or "/pool"', () => {
    let result = getCurrentPageFromLocation('/pools/789')
    expect(result).toBe(InterfacePageName.POOL_PAGE)

    result = getCurrentPageFromLocation('/pool/abc')
    expect(result).toBe(InterfacePageName.POOL_PAGE)
  })

  it('should return TOKENS_PAGE when location pathname starts with "/tokens"', () => {
    const result = getCurrentPageFromLocation('/tokens/xyz')
    expect(result).toBe(InterfacePageName.TOKENS_PAGE)
  })

  it('should return NFT_PROFILE_PAGE when location pathname starts with "/nfts/profile"', () => {
    const result = getCurrentPageFromLocation('/nfts/profile/def')
    expect(result).toBe(InterfacePageName.NFT_PROFILE_PAGE)
  })

  it('should return NFT_DETAILS_PAGE when location pathname starts with "/nfts/asset"', () => {
    const result = getCurrentPageFromLocation('/nfts/asset/ghi')
    expect(result).toBe(InterfacePageName.NFT_DETAILS_PAGE)
  })

  it('should return NFT_COLLECTION_PAGE when location pathname starts with "/nfts/collection"', () => {
    const result = getCurrentPageFromLocation('/nfts/collection/jkl')
    expect(result).toBe(InterfacePageName.NFT_COLLECTION_PAGE)
  })

  it('should return NFT_EXPLORE_PAGE when location pathname starts with "/nfts"', () => {
    const result = getCurrentPageFromLocation('/nfts/mno')
    expect(result).toBe(InterfacePageName.NFT_EXPLORE_PAGE)
  })

  it('should return undefined for unknown location pathnames', () => {
    const result = getCurrentPageFromLocation('/unknown')
    expect(result).toBeUndefined()
  })
})

describe('getCanonicalUrl', () => {
  it('should return the base URL as is', () => {
    const result = getCanonicalUrl('/swap/123')
    expect(result).toBe('http://localhost/swap/123')
  })

  it('should return the base URL without trailing slash', () => {
    const result = getCanonicalUrl('/swap/123/')
    expect(result).toBe('http://localhost/swap/123')
  })
})
