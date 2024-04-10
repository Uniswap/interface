// Copied from https://github.com/Uniswap/interface/blob/main/src/utils/uriToHttp.test.ts

import { isSVGUri, uriToHttp } from './urls'

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
})
