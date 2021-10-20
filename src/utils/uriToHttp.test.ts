import uriToHttp from './uriToHttp'

describe('uriToHttp', () => {
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
      'https://cloudflare-ipfs.com/ipfs/QmV8AfDE8GFSGQvt3vck8EwAzsPuNTmtP8VcQJE3qxRPaZ/',
      'https://ipfs.io/ipfs/QmV8AfDE8GFSGQvt3vck8EwAzsPuNTmtP8VcQJE3qxRPaZ/',
    ])
  })
  it('returns ipns gateways for ipns:// urls', () => {
    expect(uriToHttp('ipns://app.uniswap.org')).toEqual([
      'https://cloudflare-ipfs.com/ipns/app.uniswap.org/',
      'https://ipfs.io/ipns/app.uniswap.org/',
    ])
  })
  it('returns ceramic gateways for ceramic:// urls', () => {
    expect(uriToHttp('ceramic://k2t6wyfsu4pg28qrmurs1trozu32ezoa2ix3ehtbs2aul6hseekc7ox0sp1kqj')).toEqual([
      'https://gateway-clay.ceramic.network/api/v0/streams/k2t6wyfsu4pg28qrmurs1trozu32ezoa2ix3ehtbs2aul6hseekc7ox0sp1kqj',
      'https://ceramic-clay.3boxlabs.com/api/v0/streams/k2t6wyfsu4pg28qrmurs1trozu32ezoa2ix3ehtbs2aul6hseekc7ox0sp1kqj',
    ])
  })
  it('returns empty array for invalid scheme', () => {
    expect(uriToHttp('blah:test')).toEqual([])
  })
})
