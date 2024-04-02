// Copied from https://github.com/Uniswap/interface/blob/main/src/utils/uriToHttp.test.ts

import { isGifUri, isSVGUri, uriToHttp } from './urls'

describe(uriToHttp, () => {
  it('returns .eth.link for ens names', () => {
    expect(uriToHttp('t2crtokens.eth')).toEqual([])
  })
  it('returns https first for http', () => {
    expect(uriToHttp('http://test.com')).toEqual(['https://test.com', 'http://test.com'])
  })
  it('returns https for https', () => {
    expect(uriToHttp('https://test.com')).toEqual(['https://test.com'])
  })
  it('returns ipfs gateways for ipfs:// urls', () => {
    expect(uriToHttp('ipfs://QmV8AfDE8GFSGQvt3vck8EwAzsPuNTmtP8VcQJE3qxRPaZ')).toEqual([
      'https://cloudflare-ipfs.com/ipfs/QmV8AfDE8GFSGQvt3vck8EwAzsPuNTmtP8VcQJE3qxRPaZ',
      'https://ipfs.io/ipfs/QmV8AfDE8GFSGQvt3vck8EwAzsPuNTmtP8VcQJE3qxRPaZ',
    ])
  })
  it('returns ipfs gateways for wrongly formated ipfs:// urls', () => {
    expect(
      uriToHttp('ipfs://ipfs/QmSP4nq9fnN9dAiCj42ug9Wa79rqmQerZXZch82VqpiH7U/image.gif')
    ).toEqual([
      'https://cloudflare-ipfs.com/ipfs/QmSP4nq9fnN9dAiCj42ug9Wa79rqmQerZXZch82VqpiH7U/image.gif',
      'https://ipfs.io/ipfs/QmSP4nq9fnN9dAiCj42ug9Wa79rqmQerZXZch82VqpiH7U/image.gif',
    ])
  })
  it('returns ipns gateways for ipns:// urls', () => {
    expect(uriToHttp('ipns://app.uniswap.org')).toEqual([
      'https://cloudflare-ipfs.com/ipns/app.uniswap.org',
      'https://ipfs.io/ipns/app.uniswap.org',
    ])
  })
  it('returns empty array for invalid scheme', () => {
    expect(uriToHttp('blah:test')).toEqual([])
  })
})

describe(isSVGUri, () => {
  it('detects svg', () => {
    expect(isSVGUri('http://test.com/x.svg')).toEqual(true)
  })
  it(`doesn't see http`, () => {
    expect(isSVGUri('http://test.com')).toEqual(false)
  })
  it('null and undefined handled the same way', () => {
    expect(isSVGUri(null)).toEqual(false)
    expect(isSVGUri(undefined)).toEqual(false)
  })
  it('returns true for an SVG URI with uppercase extension', () => {
    expect(isSVGUri('http://example.com/image.SVG')).toEqual(true)
  })

  it('returns false for a non-SVG URI', () => {
    expect(isSVGUri('http://example.com/image.png')).toEqual(false)
  })

  it('returns true for an SVG URI with query parameters', () => {
    expect(isSVGUri('http://example.com/image.svg?query=123')).toEqual(true)
  })

  it('returns true for an SVG URI with a fragment', () => {
    expect(isSVGUri('http://example.com/image.svg#fragment')).toEqual(true)
  })

  it('returns false for a URI that contains ".svg" but is not an SVG file', () => {
    expect(isSVGUri('http://example.com/.svg/image.png')).toEqual(false)
  })

  it('returns false for a URI ending with ".svg" in the path but is actually a directory', () => {
    expect(isSVGUri('http://example.com/assets/svg/')).toEqual(false)
  })

  it('returns false for an undefined URI', () => {
    expect(isSVGUri(undefined)).toEqual(false)
  })

  it('returns false for a null URI', () => {
    expect(isSVGUri(null)).toEqual(false)
  })

  it('handles invalid URIs gracefully', () => {
    expect(isSVGUri('http:///example.com:::image.svg')).toEqual(false)
  })

  it('returns false for an empty string', () => {
    expect(isSVGUri('')).toEqual(false)
  })

  it('returns false for a non-URI string that ends with ".svg"', () => {
    expect(isSVGUri('This is not a URI.svg')).toEqual(false)
  })
})

describe(isGifUri, () => {
  it('detects gif', () => {
    expect(isGifUri('http://test.com/x.gif')).toEqual(true)
  })
  it(`doesn't see http`, () => {
    expect(isGifUri('http://test.com')).toEqual(false)
  })
  it('null and undefined handled the same way', () => {
    expect(isGifUri(null)).toEqual(false)
    expect(isGifUri(undefined)).toEqual(false)
  })
  it('returns true for an GIF URI with uppercase extension', () => {
    expect(isGifUri('http://example.com/image.GIF')).toEqual(true)
  })

  it('returns false for a non-GIF URI', () => {
    expect(isGifUri('http://example.com/image.png')).toEqual(false)
  })

  it('returns true for an gif URI with query parameters', () => {
    expect(isGifUri('http://example.com/image.gif?query=123')).toEqual(true)
  })

  it('returns true for an gif URI with a fragment', () => {
    expect(isGifUri('http://example.com/image.gif#fragment')).toEqual(true)
  })

  it('returns false for a URI that contains ".gif" but is not an gif file', () => {
    expect(isGifUri('http://example.com/.gif/image.png')).toEqual(false)
  })

  it('returns false for a URI ending with ".gif" in the path but is actually a directory', () => {
    expect(isGifUri('http://example.com/assets/gif/')).toEqual(false)
  })

  it('returns false for an undefined URI', () => {
    expect(isGifUri(undefined)).toEqual(false)
  })

  it('returns false for a null URI', () => {
    expect(isGifUri(null)).toEqual(false)
  })

  it('handles invalid URIs gracefully', () => {
    expect(isGifUri('http:///example.com:::image.gif')).toEqual(false)
  })

  it('returns false for an empty string', () => {
    expect(isGifUri('')).toEqual(false)
  })

  it('returns false for a non-URI string that ends with ".gif"', () => {
    expect(isGifUri('This is not a URI.gif')).toEqual(false)
  })
})
