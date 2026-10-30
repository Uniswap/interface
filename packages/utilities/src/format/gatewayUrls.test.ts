import {
  GATEWAY_HOSTS,
  IPFS_GATEWAY_HOST,
  resolveIpfsGatewayUrl,
  uriToGatewayUrls,
} from 'utilities/src/format/gatewayUrls'

const CID_V1 = 'bafkreicr5qh6v5b2lrn7734xkx7hy7vxgho4fqffahii5xy6bob36uvss4'
const CID_V1_DIR = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
const CID_V0 = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
const CDN = 'https://ipfs.pools.xyz/ipfs/'

describe('IPFS_GATEWAY_HOST', () => {
  it('is the one dedicated gateway host every app shares', () => {
    expect(IPFS_GATEWAY_HOST).toBe('ipfs.pools.xyz')
  })
})

describe(uriToGatewayUrls, () => {
  it('tries the dedicated gateway first, keeping the public gateways as fallbacks', () => {
    expect(uriToGatewayUrls('ipfs://QmTestHash')).toEqual([
      `${CDN}QmTestHash`,
      'https://ipfs.io/ipfs/QmTestHash/',
      'https://hardbin.com/ipfs/QmTestHash/',
    ])
  })

  it('tolerates the ipfs://ipfs/<path> form and keeps the sub-path', () => {
    expect(uriToGatewayUrls(`ipfs://ipfs/${CID_V0}/image.gif`)).toEqual([
      `${CDN}${CID_V0}/image.gif`,
      `https://ipfs.io/ipfs/${CID_V0}/image.gif/`,
      `https://hardbin.com/ipfs/${CID_V0}/image.gif/`,
    ])
  })

  it('keeps the query and fragment after the path on every candidate', () => {
    expect(uriToGatewayUrls(`ipfs://${CID_V1}?filename=logo.png#f`)).toEqual([
      `${CDN}${CID_V1}?filename=logo.png#f`,
      `https://ipfs.io/ipfs/${CID_V1}/?filename=logo.png#f`,
      `https://hardbin.com/ipfs/${CID_V1}/?filename=logo.png#f`,
    ])
  })

  it('leaves ipns on the public gateways — the dedicated gateway only serves /ipfs', () => {
    expect(uriToGatewayUrls('ipns://name.example')).toEqual([
      'https://ipfs.io/ipns/name.example/',
      'https://hardbin.com/ipns/name.example/',
    ])
  })

  it('resolves arweave through arweave.net', () => {
    expect(uriToGatewayUrls('ar://TX12345')).toEqual(['https://arweave.net/TX12345'])
  })

  it('matches the scheme case-insensitively', () => {
    expect(uriToGatewayUrls('IPFS://QmTestHash')?.[0]).toBe(`${CDN}QmTestHash`)
    expect(uriToGatewayUrls('Ar://TX12345')).toEqual(['https://arweave.net/TX12345'])
  })

  it.each([
    ['ipfs', 'ipfs://'],
    ['ipfs with only the ipfs/ prefix', 'ipfs://ipfs/'],
    ['ipns', 'ipns://'],
    ['arweave', 'ar://'],
  ])('yields no candidates for an empty %s URI', (_label, uri) => {
    expect(uriToGatewayUrls(uri)).toEqual([])
  })

  it.each([
    ['literal dot segments', 'ipfs://../../x'],
    ['dot segments after a CID', `ipfs://${CID_V1}/../../x`],
    ['encoded dot segments', `ipfs://${CID_V1}/%2e%2e/%2e%2e/x`],
    ['backslash dot segments', `ipfs://${CID_V1}/..\\..\\x`],
  ])('yields no candidates for an ipfs URI whose %s leave /ipfs/', (_label, uri) => {
    expect(uriToGatewayUrls(uri)).toEqual([])
  })

  it.each([
    ['ipns literal dot segments', 'ipns://../../x'],
    ['ipns encoded dot segments', 'ipns://name.example/%2e%2e/%2e%2e/x'],
    ['ipns backslash dot segments', 'ipns://name.example/..\\..\\x'],
    ['arweave literal dot segments', 'ar://../../x'],
  ])('yields no candidates for %s, like ipfs', (_label, uri) => {
    expect(uriToGatewayUrls(uri)).toEqual([])
  })

  it("re-points any gateway by default, and only a retired one with rewrite: 'retired'", () => {
    const pinata = `https://acct.mypinata.cloud/ipfs/${CID_V1}`
    const ipfsIo = `https://ipfs.io/ipfs/${CID_V1}`
    const subdomain = `https://gateway.ipfs.io/ipfs/${CID_V1}`
    expect(uriToGatewayUrls(pinata)).toEqual([`${CDN}${CID_V1}`, pinata])
    expect(uriToGatewayUrls(pinata, { rewrite: 'retired' })).toBeUndefined()
    expect(uriToGatewayUrls(ipfsIo, { rewrite: 'retired' })).toEqual([`${CDN}${CID_V1}`, ipfsIo])
    expect(uriToGatewayUrls(subdomain, { rewrite: 'retired' })).toEqual([`${CDN}${CID_V1}`, subdomain])
    // Raw ipfs:// URIs are not affected by the option.
    expect(uriToGatewayUrls(`ipfs://${CID_V1}`, { rewrite: 'retired' })?.[0]).toBe(`${CDN}${CID_V1}`)
  })

  it("drops a Pinata tenant's gateway token from the re-pointed URL, keeping it only on the original", () => {
    const baked = `https://acct.mypinata.cloud/ipfs/${CID_V1}?pinataGatewayToken=secret&img-width=256`
    expect(uriToGatewayUrls(baked)).toEqual([`${CDN}${CID_V1}?img-width=256`, baked])
    expect(resolveIpfsGatewayUrl(`https://acct.mypinata.cloud/ipfs/${CID_V1}?pinataGatewayToken=secret`)).toBe(
      `${CDN}${CID_V1}`,
    )
  })

  it('re-points an https URL baked against ipfs.io, keeping the original as the fallback', () => {
    const baked = `https://ipfs.io/ipfs/${CID_V1}`
    expect(uriToGatewayUrls(baked)).toEqual([`${CDN}${CID_V1}`, baked])
  })

  it('re-points an http URL baked against a gateway, upgrading the fallback before the original', () => {
    const baked = `http://ipfs.io/ipfs/${CID_V1}`
    expect(uriToGatewayUrls(baked)).toEqual([`${CDN}${CID_V1}`, `https://ipfs.io/ipfs/${CID_V1}`, baked])
  })

  it.each([
    ['plain https URL', 'https://example.com/logo.png'],
    ['plain http URL', 'http://example.com/logo.png'],
    ['URL already on the dedicated gateway', `${CDN}${CID_V1}`],
    ['gateway URL whose CID does not validate', 'https://ipfs.io/ipfs/not-a-cid.png'],
    ['ipns gateway URL', 'https://ipfs.io/ipns/example.com/logo.png'],
    ['data URI', 'data:image/png;base64,iVBORw0KGgo='],
    ['blob URI', 'blob:https://app.uniswap.org/abc-123'],
    ['file URI', 'file:///path/to/file.png'],
    ['root-relative path', '/assets/logo.png'],
    ['bare path', 'eth-logo.png'],
    ['bare word that is also a scheme name', 'ipfs'],
    ['unknown scheme', 'blah:test'],
    ['empty string', ''],
  ])('returns undefined for a %s, leaving the policy to the caller', (_label, uri) => {
    expect(uriToGatewayUrls(uri)).toBeUndefined()
  })

  it('only builds URLs on the advertised gateway hosts', () => {
    const emitted = [
      ...(uriToGatewayUrls(`ipfs://${CID_V1}`) ?? []),
      ...(uriToGatewayUrls('ipns://name.example') ?? []),
      ...(uriToGatewayUrls('ar://TX12345') ?? []),
    ]
    expect(new Set(emitted.map((url) => new URL(url).hostname))).toEqual(new Set(GATEWAY_HOSTS))
  })
})

// Replays the suite of web Launches' former `resolveLaunchIpfsImageUrl`, which this replaces.
describe(resolveIpfsGatewayUrl, () => {
  it('resolves an ipfs:// uri to the dedicated gateway', () => {
    expect(resolveIpfsGatewayUrl(`ipfs://${CID_V1}`)).toBe(`${CDN}${CID_V1}`)
    expect(resolveIpfsGatewayUrl(`ipfs://${CID_V0}`)).toBe(`${CDN}${CID_V0}`)
  })

  it('tolerates the ipfs://ipfs/<cid> form', () => {
    expect(resolveIpfsGatewayUrl(`ipfs://ipfs/${CID_V1}`)).toBe(`${CDN}${CID_V1}`)
  })

  it('rejects dot segments that would walk off the /ipfs/ route', () => {
    expect(resolveIpfsGatewayUrl('ipfs://../../x')).toBeUndefined()
    expect(resolveIpfsGatewayUrl(`ipfs://${CID_V1}/../../x`)).toBeUndefined()
    expect(resolveIpfsGatewayUrl('ipfs://./x')).toBeUndefined()
  })

  it('rejects the encoded and backslash dot segments only the URL parser normalizes', () => {
    expect(resolveIpfsGatewayUrl(`ipfs://${CID_V1}/%2e%2e/%2e%2e/x`)).toBeUndefined()
    expect(resolveIpfsGatewayUrl(`ipfs://${CID_V1}/.%2e/%2e./x`)).toBeUndefined()
    expect(resolveIpfsGatewayUrl(`ipfs://${CID_V1}/..\\..\\x`)).toBeUndefined()
  })

  it('stays on the route for a single dot segment, which only cancels the CID', () => {
    // One `%2e%2e` normalizes `/ipfs/<cid>/%2e%2e/x` to `/ipfs/x`: still on the route, and a 404 rather than an escape.
    expect(resolveIpfsGatewayUrl(`ipfs://${CID_V1}/%2e%2e/x`)).toBe(`${CDN}x`)
  })

  it('still resolves directory forms, which are the reason the path is kept', () => {
    expect(resolveIpfsGatewayUrl(`ipfs://${CID_V1_DIR}/logo.png`)).toBe(`${CDN}${CID_V1_DIR}/logo.png`)
  })

  it('passes https urls through unchanged', () => {
    expect(resolveIpfsGatewayUrl('https://example.com/logo.png')).toBe('https://example.com/logo.png')
  })

  it('re-points an already-baked ipfs.io gateway url', () => {
    expect(resolveIpfsGatewayUrl(`https://ipfs.io/ipfs/${CID_V1}`)).toBe(`${CDN}${CID_V1}`)
    expect(resolveIpfsGatewayUrl(`https://ipfs.io/ipfs/${CID_V0}`)).toBe(`${CDN}${CID_V0}`)
  })

  it('re-points any gateway host, since /ipfs/<cid> is content-addressed', () => {
    expect(resolveIpfsGatewayUrl(`https://gateway.pinata.cloud/ipfs/${CID_V1}`)).toBe(`${CDN}${CID_V1}`)
    expect(resolveIpfsGatewayUrl(`https://token-launcher-uniswap.mypinata.cloud/ipfs/${CID_V1}`)).toBe(
      `${CDN}${CID_V1}`,
    )
    expect(resolveIpfsGatewayUrl(`https://hardbin.com/ipfs/${CID_V1}`)).toBe(`${CDN}${CID_V1}`)
    expect(resolveIpfsGatewayUrl(`https://some-new-vanity-gateway.xyz/ipfs/${CID_V1}`)).toBe(`${CDN}${CID_V1}`)
    expect(resolveIpfsGatewayUrl(`http://ipfs.io/ipfs/${CID_V1}`)).toBe(`${CDN}${CID_V1}`)
    expect(resolveIpfsGatewayUrl(`https://IPFS.IO/ipfs/${CID_V1}`)).toBe(`${CDN}${CID_V1}`)
  })

  it('re-points the subdomain-gateway form', () => {
    expect(resolveIpfsGatewayUrl(`https://${CID_V1}.ipfs.dweb.link`)).toBe(`${CDN}${CID_V1}`)
    // A bare subdomain-gateway root is normalized: the trailing slash is the host's, not the CID's.
    expect(resolveIpfsGatewayUrl(`https://${CID_V1}.ipfs.nftstorage.link/`)).toBe(`${CDN}${CID_V1}`)
    expect(resolveIpfsGatewayUrl(`https://${CID_V1_DIR}.ipfs.inbrowser.link/logo.png?v=2`)).toBe(
      `${CDN}${CID_V1_DIR}/logo.png?v=2`,
    )
  })

  it('preserves the sub-path, trailing slash, query and fragment after the CID', () => {
    expect(resolveIpfsGatewayUrl(`https://ipfs.io/ipfs/${CID_V1_DIR}/1905`)).toBe(`${CDN}${CID_V1_DIR}/1905`)
    expect(resolveIpfsGatewayUrl(`https://ipfs.io/ipfs/${CID_V1_DIR}/`)).toBe(`${CDN}${CID_V1_DIR}/`)
    expect(resolveIpfsGatewayUrl(`https://ipfs.io/ipfs/${CID_V1}?filename=logo.png`)).toBe(
      `${CDN}${CID_V1}?filename=logo.png`,
    )
    expect(resolveIpfsGatewayUrl(`https://ipfs.io/ipfs/${CID_V1}?img-width=256&variant=card`)).toBe(
      `${CDN}${CID_V1}?img-width=256&variant=card`,
    )
    expect(resolveIpfsGatewayUrl(`https://ipfs.io/ipfs/${CID_V1}?gmgn_exp=1756000000&gmgn_sig=abc123`)).toBe(
      `${CDN}${CID_V1}?gmgn_exp=1756000000&gmgn_sig=abc123`,
    )
    expect(resolveIpfsGatewayUrl(`https://ipfs.io/ipfs/${CID_V1_DIR}/logo.png?a=1#frag`)).toBe(
      `${CDN}${CID_V1_DIR}/logo.png?a=1#frag`,
    )
    expect(resolveIpfsGatewayUrl(`ipfs://${CID_V1}?filename=logo.png`)).toBe(`${CDN}${CID_V1}?filename=logo.png`)
    expect(resolveIpfsGatewayUrl(`ipfs://${CID_V1_DIR}/logo.png?img-width=256`)).toBe(
      `${CDN}${CID_V1_DIR}/logo.png?img-width=256`,
    )
  })

  it('guards the /ipfs/ipfs/<cid> double path, which would otherwise yield the CID "ipfs"', () => {
    expect(resolveIpfsGatewayUrl(`https://ipfs.io/ipfs/ipfs/${CID_V1}`)).toBe(`${CDN}${CID_V1}`)
  })

  it('is idempotent — a url already on the dedicated gateway is left alone', () => {
    expect(resolveIpfsGatewayUrl(`${CDN}${CID_V1}`)).toBe(`${CDN}${CID_V1}`)
    expect(resolveIpfsGatewayUrl(`https://pools.xyz/ipfs/${CID_V1}`)).toBe(`https://pools.xyz/ipfs/${CID_V1}`)
    expect(resolveIpfsGatewayUrl(resolveIpfsGatewayUrl(`ipfs://${CID_V1_DIR}/logo.png`))).toBe(
      `${CDN}${CID_V1_DIR}/logo.png`,
    )
  })

  it("re-points a logo baked against the gateway's older pools.trade name onto the canonical host", () => {
    expect(resolveIpfsGatewayUrl(`https://ipfs.pools.trade/ipfs/${CID_V1}`)).toBe(`${CDN}${CID_V1}`)
  })

  it('does not re-point ipns, which the dedicated gateway does not serve', () => {
    expect(resolveIpfsGatewayUrl('https://ipfs.io/ipns/example.com/logo.png')).toBe(
      'https://ipfs.io/ipns/example.com/logo.png',
    )
    expect(resolveIpfsGatewayUrl('ipns://example.com/logo.png')).toBe('ipns://example.com/logo.png')
  })

  it('leaves a baked gateway url alone when its CID does not validate', () => {
    expect(resolveIpfsGatewayUrl('https://ipfs.io/ipfs/not-a-cid.png')).toBe('https://ipfs.io/ipfs/not-a-cid.png')
    expect(resolveIpfsGatewayUrl('https://ipfs.io/ipfs/')).toBe('https://ipfs.io/ipfs/')
  })

  it('resolves a raw ipfs:// uri without validating the CID shape', () => {
    // Deliberate change from the Launches resolver, which returned these unchanged for the shared resolver to send to
    // ipfs.io: a non-CID 404s on either gateway. The shape check stays where it is load-bearing, on the host-agnostic
    // rewrite above, and raw URIs keep resolving in encodings it does not cover (base36, base58btc CIDv1).
    expect(resolveIpfsGatewayUrl('ipfs://bafytest')).toBe(`${CDN}bafytest`)
    expect(resolveIpfsGatewayUrl('ipfs://https://pbs.twimg.com/media/abc.jpg')).toBe(
      `${CDN}https://pbs.twimg.com/media/abc.jpg`,
    )
  })

  it('still resolves a base32 CID one character short, which shape alone cannot catch', () => {
    const oneCharShort = CID_V1.slice(0, -1)
    expect(resolveIpfsGatewayUrl(`ipfs://${oneCharShort}`)).toBe(`${CDN}${oneCharShort}`)
    expect(resolveIpfsGatewayUrl(`https://ipfs.io/ipfs/${oneCharShort}`)).toBe(`${CDN}${oneCharShort}`)
  })

  it('does not match a CID that only appears in a filename or a wrapped query param', () => {
    const coingecko = `https://assets.coingecko.com/coins/images/15144/large/${CID_V1_DIR}.ipfs.infura-ipfs.io.png?1622176770`
    expect(resolveIpfsGatewayUrl(coingecko)).toBe(coingecko)
    const wrapped = `https://wsrv.nl/?url=https%3A%2F%2Fipfs.io%2Fipfs%2F${CID_V1}`
    expect(resolveIpfsGatewayUrl(wrapped)).toBe(wrapped)
    const proxied = `https://image.solanatracker.io/proxy?url=https%3A%2F%2Fipfs.io%2Fipfs%2F${CID_V1}`
    expect(resolveIpfsGatewayUrl(proxied)).toBe(proxied)
  })

  it('leaves other non-ipfs logo sources alone', () => {
    expect(resolveIpfsGatewayUrl('https://arweave.net/abc123')).toBe('https://arweave.net/abc123')
    expect(resolveIpfsGatewayUrl('ar://abc123')).toBe('ar://abc123')
    expect(resolveIpfsGatewayUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=')
    expect(resolveIpfsGatewayUrl('blob:https://app.uniswap.org/abc-123')).toBe('blob:https://app.uniswap.org/abc-123')
    expect(resolveIpfsGatewayUrl('not a url')).toBe('not a url')
  })

  it('passes the empty string through unchanged', () => {
    expect(resolveIpfsGatewayUrl('')).toBe('')
  })

  it('passes undefined through for logo-less entries', () => {
    expect(resolveIpfsGatewayUrl(undefined)).toBeUndefined()
  })

  // Replays web CreateAuction's former `resolveTokenImageSrc` (Pinata's public gateway): a freshly pinned CID is
  // immediately fetchable through the dedicated gateway too, since it fronts the account the launcher pins to.
  it('resolves a freshly uploaded launch logo', () => {
    expect(resolveIpfsGatewayUrl('ipfs://bafybeicb34tk4xdiqk2qatukpcguo4ojimxxxh5tge2rtolpkme5hemlem')).toBe(
      `${CDN}bafybeicb34tk4xdiqk2qatukpcguo4ojimxxxh5tge2rtolpkme5hemlem`,
    )
    expect(resolveIpfsGatewayUrl('ipfs://ipfs/bafkreitest')).toBe(`${CDN}bafkreitest`)
  })
})
