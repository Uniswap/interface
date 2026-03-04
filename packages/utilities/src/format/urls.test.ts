// Copied from https://github.com/Uniswap/interface/blob/main/src/utils/uriToHttp.test.ts

import {
  extractBaseUrl,
  extractUrlHost,
  formatDappURL,
  isGifUri,
  isHttpUri,
  isSVGUri,
  sanitizeAvatarUrl,
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
  it('returns empty array for bare path without allowLocalUri', () => {
    expect(uriToHttpUrls('eth-logo.png')).toEqual([])
  })
  it('returns bare path when allowLocalUri is true', () => {
    expect(uriToHttpUrls('eth-logo.png', { allowLocalUri: true })).toEqual(['eth-logo.png'])
  })
  it('returns file:// URI when allowLocalUri is true', () => {
    expect(uriToHttpUrls('file:///path/to/file.png', { allowLocalUri: true })).toEqual(['file:///path/to/file.png'])
  })
  it('returns empty array for file:// URI without allowLocalUri', () => {
    expect(uriToHttpUrls('file:///path/to/file.png')).toEqual([])
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

describe(isHttpUri, () => {
  describe('valid HTTP/HTTPS URIs', () => {
    it('returns true for https URI', () => {
      expect(isHttpUri('https://example.com')).toBe(true)
    })

    it('returns true for http URI', () => {
      expect(isHttpUri('http://example.com')).toBe(true)
    })

    it('returns true for https URI with path', () => {
      expect(isHttpUri('https://example.com/path/to/resource')).toBe(true)
    })

    it('returns true for https URI with query parameters', () => {
      expect(isHttpUri('https://example.com?query=value')).toBe(true)
    })

    it('returns true for https URI with fragment', () => {
      expect(isHttpUri('https://example.com#section')).toBe(true)
    })

    it('returns true for https URI with port', () => {
      expect(isHttpUri('https://example.com:8080')).toBe(true)
    })

    it('returns true for localhost', () => {
      expect(isHttpUri('http://localhost:3000')).toBe(true)
    })
  })

  describe('invalid URIs', () => {
    it('returns false for ipfs URI', () => {
      expect(isHttpUri('ipfs://QmHash')).toBe(false)
    })

    it('returns false for ipns URI', () => {
      expect(isHttpUri('ipns://example.eth')).toBe(false)
    })

    it('returns false for data URI', () => {
      expect(isHttpUri('data:text/plain;base64,SGVsbG8=')).toBe(false)
    })

    it('returns false for file URI', () => {
      expect(isHttpUri('file:///path/to/file')).toBe(false)
    })

    it('returns false for ftp URI', () => {
      expect(isHttpUri('ftp://example.com')).toBe(false)
    })

    it('returns false for ar (arweave) URI', () => {
      expect(isHttpUri('ar://txid')).toBe(false)
    })

    it('returns false for javascript URI', () => {
      // eslint-disable-next-line no-script-url
      expect(isHttpUri('javascript:alert(1)')).toBe(false)
    })

    it('returns false for malformed URI', () => {
      expect(isHttpUri('not a valid uri')).toBe(false)
    })

    it('returns false for URI without protocol', () => {
      expect(isHttpUri('example.com')).toBe(false)
    })
  })

  describe('null and undefined handling', () => {
    it('returns false for null', () => {
      expect(isHttpUri(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isHttpUri(undefined)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isHttpUri('')).toBe(false)
    })

    it('returns false for whitespace-only string', () => {
      expect(isHttpUri('   ')).toBe(false)
    })

    it('returns false for string with only tabs and newlines', () => {
      expect(isHttpUri('\t\n')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('returns true for uppercase HTTPS', () => {
      expect(isHttpUri('HTTPS://example.com')).toBe(true)
    })

    it('returns true for mixed case protocol', () => {
      expect(isHttpUri('HtTpS://example.com')).toBe(true)
    })

    it('handles http with single slash (relative URL style)', () => {
      // URL constructor treats 'http:example.com' as relative URL with scheme
      expect(isHttpUri('http:example.com')).toBe(true)
    })
  })
})

describe(sanitizeAvatarUrl, () => {
  it('returns the original URL for https', () => {
    const url = 'https://example.com/avatar.png'
    expect(sanitizeAvatarUrl(url)).toBe(url)
  })

  it('returns the original URL for http', () => {
    const url = 'http://example.com/avatar.png'
    expect(sanitizeAvatarUrl(url)).toBe(url)
  })

  it('returns null for non-HTTP URLs', () => {
    expect(sanitizeAvatarUrl('ipfs://QmHash123')).toBeNull()
    expect(sanitizeAvatarUrl('data:image/png;base64,iVBORw0KGgo=')).toBeNull()
    // eslint-disable-next-line no-script-url
    expect(sanitizeAvatarUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeAvatarUrl('eip155:1/erc721:0xabc/123')).toBeNull()
  })

  it('returns null for null or empty input', () => {
    expect(sanitizeAvatarUrl(null)).toBeNull()
    expect(sanitizeAvatarUrl('')).toBeNull()
  })

  it('accepts IPFS gateway URLs (already converted to HTTPS)', () => {
    const url = 'https://cloudflare-ipfs.com/ipfs/QmHash123'
    expect(sanitizeAvatarUrl(url)).toBe(url)
  })
})
