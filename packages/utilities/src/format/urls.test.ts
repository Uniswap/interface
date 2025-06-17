// Copied from https://github.com/Uniswap/interface/blob/main/src/utils/uriToHttp.test.ts

import {
  extractBaseUrl,
  extractUrlHost,
  formatDappURL,
  isGifUri,
  isSVGUri,
  uriToHttpUrls,
} from 'utilities/src/format/urls'

describe(uriToHttpUrls, () => {
  it('returns .eth.link for ens names', () => {
    expect(uriToHttpUrls('t2crtokens.eth')).toEqual([])
  })
  it('returns https first for http', () => {
    expect(uriToHttpUrls('http://test.com')).toEqual(['https://test.com', 'http://test.com'])
  })
  it('returns https for https', () => {
    expect(uriToHttpUrls('https://test.com')).toEqual(['https://test.com'])
  })
  it('returns ipfs gateways for ipfs:// urls', () => {
    expect(uriToHttpUrls('ipfs://QmV8AfDE8GFSGQvt3vck8EwAzsPuNTmtP8VcQJE3qxRPaZ')).toEqual([
      'https://ipfs.io/ipfs/QmV8AfDE8GFSGQvt3vck8EwAzsPuNTmtP8VcQJE3qxRPaZ/',
      'https://hardbin.com/ipfs/QmV8AfDE8GFSGQvt3vck8EwAzsPuNTmtP8VcQJE3qxRPaZ/',
    ])
  })
  it('returns ipfs gateways for wrongly formated ipfs:// urls', () => {
    expect(uriToHttpUrls('ipfs://ipfs/QmSP4nq9fnN9dAiCj42ug9Wa79rqmQerZXZch82VqpiH7U/image.gif')).toEqual([
      'https://ipfs.io/ipfs/QmSP4nq9fnN9dAiCj42ug9Wa79rqmQerZXZch82VqpiH7U/image.gif/',
      'https://hardbin.com/ipfs/QmSP4nq9fnN9dAiCj42ug9Wa79rqmQerZXZch82VqpiH7U/image.gif/',
    ])
  })
  it('returns ipns gateways for ipns:// urls', () => {
    expect(uriToHttpUrls('ipns://app.uniswap.org')).toEqual([
      'https://ipfs.io/ipns/app.uniswap.org/',
      'https://hardbin.com/ipns/app.uniswap.org/',
    ])
  })
  it('returns empty array for invalid scheme', () => {
    expect(uriToHttpUrls('blah:test')).toEqual([])
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

describe(formatDappURL, () => {
  it.each`
    input                                          | expected
    ${'http://example.com'}                        | ${'http://example.com'}
    ${'http://example.com/'}                       | ${'http://example.com'}
    ${'https://example.com'}                       | ${'example.com'}
    ${'https://example.com/'}                      | ${'example.com'}
    ${'https://www.example.com/'}                  | ${'www.example.com'}
    ${'https://example.com?test=true&test2=false'} | ${'example.com'}
    ${'not a url'}                                 | ${'not a url'}
    ${'should return only part of this'}           | ${'should return only p'}
  `('input=$input should be expected=$expected', async ({ input, expected }) => {
    expect(formatDappURL(input)).toEqual(expected)
  })
})

describe(extractUrlHost, () => {
  it.each`
    input                                          | expected
    ${'http://example.com'}                        | ${'example.com'}
    ${'http://example.com/'}                       | ${'example.com'}
    ${'https://example.com'}                       | ${'example.com'}
    ${'https://example.com/'}                      | ${'example.com'}
    ${'https://www.example.com/'}                  | ${'www.example.com'}
    ${'https://example.com?test=true&test2=false'} | ${'example.com'}
    ${undefined}                                   | ${undefined}
    ${'not a url'}                                 | ${undefined}
  `('input=$input should be expected=$expected', async ({ input, expected }) => {
    expect(extractUrlHost(input)).toEqual(expected)
  })
})

describe(extractBaseUrl, () => {
  it.each`
    input                                          | expected
    ${'http://example.com'}                        | ${'http://example.com'}
    ${'https://example.com'}                       | ${'https://example.com'}
    ${'https://www.example.com/woof'}              | ${'https://www.example.com'}
    ${'https://example.com?test=true&test2=false'} | ${'https://example.com'}
    ${undefined}                                   | ${undefined}
    ${'not a url'}                                 | ${undefined}
  `('input=$input should be expected=$expected', async ({ input, expected }) => {
    expect(extractBaseUrl(input)).toEqual(expected)
  })
})
