/**
 * Gateway resolution for content-addressed image URIs (`ipfs://`, `ipns://`, `ar://`, and http(s) URLs already baked
 * against an IPFS gateway). Dependency-free on purpose: `urls.ts` builds `uriToHttpUrls` on top of it, and apps that
 * cannot take that file's platform imports (Pools) use it directly.
 */

/**
 * Dedicated IPFS gateway: CloudFront in front of the launcher's Pinata gateway. Launch art is pinned behind it, so a
 * fresh CID resolves immediately; it also resolves CIDs it does not pin (a cold pull can take a while). It serves
 * `/ipfs/*` only (no ipns), with `Access-Control-Allow-Origin: *`, so canvas color extraction works on its images.
 */
export const IPFS_GATEWAY_HOST = 'ipfs.pools.xyz'

const PUBLIC_IPFS_GATEWAY_HOSTS = ['ipfs.io', 'hardbin.com']
const ARWEAVE_GATEWAY_HOST = 'arweave.net'

/**
 * Gateways that no longer serve `<img>` loads: ipfs.io retired on 2026-09-21 (https://gatewaychanges.ipfs.io/) and now
 * answers browsers with a Cloudflare challenge page, and hardbin.com doesn't respond. Subdomains count (`gateway.ipfs.io`).
 */
const RETIRED_GATEWAY_HOSTS = ['ipfs.io', 'hardbin.com']

function isRetiredGatewayHost(hostname: string): boolean {
  return RETIRED_GATEWAY_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))
}

/** Which baked gateway URLs to re-point at the dedicated gateway: any IPFS gateway's, or only a retired one's. */
export type GatewayRewrite = 'any' | 'retired'

/** Every host `uriToGatewayUrls` builds a URL on, for callers that pin outbound fetches to it. */
export const GATEWAY_HOSTS: readonly string[] = [IPFS_GATEWAY_HOST, ...PUBLIC_IPFS_GATEWAY_HOSTS, ARWEAVE_GATEWAY_HOST]

const IPFS_GATEWAY_PREFIX = `https://${IPFS_GATEWAY_HOST}/ipfs/`
const IPFS_PATH_PREFIX = '/ipfs/'
const PINATA_GATEWAY_TOKEN_PARAM = 'pinataGatewayToken'

/**
 * The CID shape data-ingestion's `LaunchpadImageResolver` validates: CIDv0 base58 (`Qm…`) or CIDv1 lowercase base32
 * (`baf…`), with an optional sub-path. It gates the host-agnostic rewrite of baked gateway URLs, so a filename or a
 * wrapped query param that merely contains a CID is never re-pointed. No upper length bound, to match ingestion.
 *
 * The sub-path is asserted with a lookahead instead of consumed: a quantified group wrapping `.*` reads as nested
 * repetition to the ReDoS linter.
 */
const IPFS_CID_WITH_OPTIONAL_PATH_REGEX = /^(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z2-7]{50,})(?=$|\/)/

/** Tolerates `ipfs://<path>` and `ipfs://ipfs/<path>`; splits the query and fragment off so they survive the rewrite. */
const IPFS_URI_REGEX = /^ipfs:(?:\/\/)?(?:ipfs\/)?([^?#]*)([\s\S]*)$/i

function isOwnGatewayHost(hostname: string): boolean {
  return hostname === 'pools.xyz' || hostname.endsWith('.pools.xyz')
}

/**
 * `path` appended to a gateway route prefix, or undefined when it is empty or would leave the route. The path is
 * creator-supplied: `ipfs://../../x` would otherwise normalize to `https://<gateway>/x`. WHATWG parsing also folds
 * `%2e%2e` and `\` into dot segments, which a scan of the input cannot see, so the route is re-checked on the parsed URL.
 */
function urlUnderRoute({
  routePrefix,
  path,
  suffix = '',
}: {
  routePrefix: string
  path: string
  suffix?: string
}): URL | undefined {
  if (!path || path.split('/').some((segment) => segment === '.' || segment === '..')) {
    return undefined
  }
  let url: URL
  try {
    url = new URL(`${routePrefix}${path}${suffix}`)
  } catch {
    return undefined
  }
  const route = new URL(routePrefix).pathname
  return url.pathname.length > route.length && url.pathname.startsWith(route) ? url : undefined
}

function dedicatedGatewayUrl(ipfsPath: string, queryAndFragment: string): URL | undefined {
  return urlUnderRoute({ routePrefix: IPFS_GATEWAY_PREFIX, path: ipfsPath, suffix: queryAndFragment })
}

function ipfsUriToDedicatedGatewayUrl(uri: string): URL | undefined {
  const [, ipfsPath = '', queryAndFragment = ''] = uri.match(IPFS_URI_REGEX) ?? []
  return dedicatedGatewayUrl(ipfsPath, queryAndFragment)
}

function ipfsPathFromGatewayUrl(url: URL): string | undefined {
  if (url.pathname.startsWith(IPFS_PATH_PREFIX)) {
    // `/ipfs/ipfs/<cid>` occurs in real rows; without this the CID would be the literal `ipfs`.
    const ipfsPath = url.pathname.slice(IPFS_PATH_PREFIX.length).replace(/^ipfs\//, '')
    return IPFS_CID_WITH_OPTIONAL_PATH_REGEX.test(ipfsPath) ? ipfsPath : undefined
  }
  // Subdomain gateways (`https://<cid>.ipfs.dweb.link/…`). URL parsing lower-cases the hostname, so only base32
  // CIDv1 can match, which is the only form subdomain gateways serve.
  const subdomainCid = url.hostname.match(/^([^.]+)\.ipfs\..+$/)?.[1]
  if (subdomainCid === undefined || !IPFS_CID_WITH_OPTIONAL_PATH_REGEX.test(subdomainCid)) {
    return undefined
  }
  return url.pathname === '/' ? subdomainCid : `${subdomainCid}${url.pathname}`
}

/**
 * Re-points an http(s) URL baked against any IPFS gateway (ipfs.io, Pinata tenants, vanity hosts, subdomain gateways)
 * at the dedicated gateway, keeping the sub-path, query and fragment verbatim (some logos resolve through signed or
 * sizing params) apart from a Pinata tenant's `pinataGatewayToken`. Matching is structural rather than a host list because `/ipfs/<cid>` is content-addressed: the same
 * CID names the same bytes on any gateway. Undefined for anything else, including `/ipns/` (the dedicated gateway
 * serves `/ipfs/*` only) and URLs already on the dedicated gateway's domain. With `rewrite: 'retired'`, a URL on a
 * gateway that still works is left alone too.
 */
function rebakedIpfsGatewayUrl(uri: string, rewrite: GatewayRewrite = 'any'): URL | undefined {
  // Every rendered image URL passes through here; skip the parse for the ones that cannot match.
  if (!/ipfs/i.test(uri)) {
    return undefined
  }
  let url: URL
  try {
    url = new URL(uri)
  } catch {
    return undefined
  }
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || isOwnGatewayHost(url.hostname)) {
    return undefined
  }
  if (rewrite === 'retired' && !isRetiredGatewayHost(url.hostname)) {
    return undefined
  }
  const ipfsPath = ipfsPathFromGatewayUrl(url)
  if (ipfsPath === undefined) {
    return undefined
  }
  // A Pinata tenant's access token is that account's secret and means nothing on our gateway. Deleting re-serializes
  // the whole query, so only touch it when the token is there.
  if (url.searchParams.has(PINATA_GATEWAY_TOKEN_PARAM)) {
    url.searchParams.delete(PINATA_GATEWAY_TOKEN_PARAM)
  }
  return dedicatedGatewayUrl(ipfsPath, `${url.search}${url.hash}`)
}

/**
 * Fetchable https candidates, in preference order, for a content-addressed URI:
 *
 * - `ipfs://<cid>[/path]` → the dedicated gateway, then the public gateways
 * - `ipns://<name>` → the public gateways
 * - `ar://<tx>` → arweave.net
 * - an http(s) URL baked against an IPFS gateway → the dedicated gateway, then the URL as given. `rewrite: 'retired'`
 *   limits this to retired gateways (ipfs.io, hardbin.com), so a link on a working gateway stays as given
 *
 * An empty or route-escaping IPFS/IPNS/Arweave URI yields `[]`. Anything else yields undefined, so each caller keeps
 * its own policy for plain http(s), `data:`, `blob:` and local paths.
 */
export function uriToGatewayUrls(uri: string, options?: { rewrite?: GatewayRewrite }): string[] | undefined {
  const scheme = uri.match(/^([a-z][\d+.a-z-]*):/i)?.[1]?.toLowerCase()
  switch (scheme) {
    case 'ipfs': {
      const url = ipfsUriToDedicatedGatewayUrl(uri)
      if (url === undefined) {
        return []
      }
      const fallbackPath = `${url.pathname.slice(IPFS_PATH_PREFIX.length)}/${url.search}${url.hash}`
      return [url.href, ...PUBLIC_IPFS_GATEWAY_HOSTS.map((host) => `https://${host}/ipfs/${fallbackPath}`)]
    }
    case 'ipns': {
      const name = uri.match(/^ipns:(?:\/\/)?(.*)$/i)?.[1] ?? ''
      return PUBLIC_IPFS_GATEWAY_HOSTS.flatMap(
        (host) => urlUnderRoute({ routePrefix: `https://${host}/ipns/`, path: name, suffix: '/' })?.href ?? [],
      )
    }
    case 'ar': {
      const tx = uri.match(/^ar:(?:\/\/)?(.*)$/i)?.[1] ?? ''
      const url = urlUnderRoute({ routePrefix: `https://${ARWEAVE_GATEWAY_HOST}/`, path: tx })
      return url ? [url.href] : []
    }
    case 'http':
    case 'https': {
      const rebaked = rebakedIpfsGatewayUrl(uri, options?.rewrite)
      if (!rebaked) {
        return undefined
      }
      // Keep uriToHttpUrls' https upgrade ahead of an http original: alone, it would be blocked as mixed content.
      return scheme === 'http' ? [rebaked.href, `https${uri.slice(4)}`, uri] : [rebaked.href, uri]
    }
    default:
      return undefined
  }
}

/**
 * Single-URL form for data that is stored or handed to code other than an image component (launch metadata, canvas
 * color extraction, a preload): IPFS content, raw `ipfs://` or baked against a gateway, becomes its dedicated-gateway
 * URL; an `ipfs://` URI that is empty or escapes `/ipfs/` becomes undefined; everything else is returned unchanged.
 */
export function resolveIpfsGatewayUrl(uri: string | undefined): string | undefined {
  if (!uri) {
    return uri
  }
  if (/^ipfs:/i.test(uri)) {
    return ipfsUriToDedicatedGatewayUrl(uri)?.href
  }
  return rebakedIpfsGatewayUrl(uri)?.href ?? uri
}
