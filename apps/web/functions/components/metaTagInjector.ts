import { META_TAG_FETCH_TIMEOUT_MS } from 'functions/constants'
import { Data } from 'functions/utils/cache'
import getAuction from 'functions/utils/getAuction'
import getPool from 'functions/utils/getPool'
import getPosition from 'functions/utils/getPosition'
import { getRequest } from 'functions/utils/getRequest'
import getToken from 'functions/utils/getToken'
import { Context, Next } from 'hono'
import { encode } from 'html-entities'
import { withTimeout } from 'uniswap/src/utils/polling'
import { paths } from '~/pages/paths'
import { MetaTagInjectorInput } from '~/shared-cloud/metatags'

// Shared links often carry trailing slashes (e.g. /launches/); normalize so they match their canonical path.
function stripTrailingSlash(pathname: string): string {
  const stripped = pathname.replace(/\/+$/, '')
  return stripped === '' ? '/' : stripped
}

function doesMatchPath(path: string): boolean {
  const regexPaths = paths.map((p) => '^' + p.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$')
  // These come from a constant we define (paths.ts), so we don't need to worry about them being malicious.
  // oxlint-disable-next-line security/detect-non-literal-regexp
  return regexPaths.some((regex) => new RegExp(regex).test(path))
}

function parseExplorePath(
  pathname: string,
): { type: 'token' | 'pool' | 'auction'; networkName: string; address: string } | null {
  const tokenMatch = pathname.match(/^\/explore\/tokens\/([^/]+)\/([^/]+)$/)
  if (tokenMatch) {
    return {
      type: 'token',
      networkName: tokenMatch[1],
      address: tokenMatch[2],
    }
  }
  const poolMatch = pathname.match(/^\/explore\/pools\/([^/]+)\/([^/]+)$/)
  if (poolMatch) {
    return {
      type: 'pool',
      networkName: poolMatch[1],
      address: poolMatch[2],
    }
  }
  const auctionMatch = pathname.match(/^\/explore\/auctions\/([^/]+)\/([^/]+)$/)
  if (auctionMatch) {
    return {
      type: 'auction',
      networkName: auctionMatch[1],
      address: auctionMatch[2],
    }
  }
  return null
}

function parsePositionPath(
  pathname: string,
): { version: 'v2' | 'v3' | 'v4'; chainName: string; identifier: string } | null {
  const match = pathname.match(/^\/positions\/(v2|v3|v4)\/([^/]+)\/([^/]+)$/)
  if (match) {
    return {
      version: match[1] as 'v2' | 'v3' | 'v4',
      chainName: match[2],
      identifier: match[3],
    }
  }
  return null
}

function defaultImageUri(origin: string): string {
  return origin + '/images/1200x630_Rich_Link_Preview_Image.png'
}

// oxlint-disable-next-line max-params
function append(tags: string, attribute: string, content: string): string {
  return tags + `<meta ${attribute} content="${encode(content)}" data-rh="true">\n`
}

function generateMetaTags(data: MetaTagInjectorInput, blockedPaths?: string): string {
  let metaTags = ''
  if (data.description) {
    metaTags = append(metaTags, 'name="description"', data.description)
  }
  metaTags = append(metaTags, 'property="og:title"', data.title)
  if (data.description) {
    metaTags = append(metaTags, 'property="og:description"', data.description)
  }
  if (data.image) {
    metaTags = append(metaTags, 'property="og:image"', data.image)
    metaTags = append(metaTags, 'property="og:image:width"', '1200')
    metaTags = append(metaTags, 'property="og:image:height"', '630')
    metaTags = append(metaTags, 'property="og:image:alt"', data.title)
  }
  metaTags = append(metaTags, 'property="og:type"', 'website')
  metaTags = append(metaTags, 'property="og:url"', data.url)
  metaTags = append(metaTags, 'property="twitter:card"', 'summary_large_image')
  metaTags = append(metaTags, 'property="twitter:title"', data.title)
  if (data.image) {
    metaTags = append(metaTags, 'property="twitter:image"', data.image)
    metaTags = append(metaTags, 'property="twitter:image:alt"', data.title)
  }
  if (blockedPaths) {
    metaTags = append(metaTags, 'property="x:blocked-paths"', blockedPaths)
  }
  return metaTags
}

async function fetchExploreData({
  type,
  networkName,
  address,
  origin,
  requestUrl,
}: {
  type: 'token' | 'pool' | 'auction'
  networkName: string
  address: string
  origin: string
  requestUrl: string
}): Promise<MetaTagInjectorInput | null> {
  const cachePath = type === 'auction' ? 'auctions' : `${type}s`
  const cacheUrl = `${origin}/${cachePath}/${networkName}/${address}`

  const validateDataToken = (data: Data): data is NonNullable<Awaited<ReturnType<typeof getToken>>> =>
    Boolean(data.tokenData?.symbol && data.name)

  const validateDataPool = (data: Data): data is NonNullable<Awaited<ReturnType<typeof getPool>>> => Boolean(data.title)
  const validateDataAuction = (data: Data): data is NonNullable<Awaited<ReturnType<typeof getAuction>>> =>
    Boolean(data.auctionData?.tokenSymbol && data.name)

  const data = await getRequest({
    url: cacheUrl,
    getData: () =>
      type === 'token'
        ? getToken({ networkName, tokenAddress: address, url: cacheUrl })
        : type === 'pool'
          ? getPool({ networkName, poolAddress: address, url: cacheUrl })
          : getAuction({ chainName: networkName, auctionAddress: address, url: cacheUrl }),
    validateData: type === 'token' ? validateDataToken : type === 'pool' ? validateDataPool : validateDataAuction,
  })

  return data ? { title: data.title, image: data.image, url: requestUrl, description: data.description } : null
}

async function fetchPositionData({
  version,
  chainName,
  identifier,
  origin,
  requestUrl,
}: {
  version: 'v2' | 'v3' | 'v4'
  chainName: string
  identifier: string
  origin: string
  requestUrl: string
}): Promise<MetaTagInjectorInput | null> {
  const cacheUrl = `${origin}/positions/${version}/${chainName}/${identifier}`

  const data = await getRequest({
    url: cacheUrl,
    getData: () => getPosition({ version, chainName, identifier, url: cacheUrl }),
    validateData: (data): data is NonNullable<Awaited<ReturnType<typeof getPosition>>> => Boolean(data.title),
  })

  return data ? { title: data.title, image: data.image, url: requestUrl } : null
}

/**
 * The UK path restriction, from whichever edge is in front: Cloudflare sets
 * `x-blocked-paths: /` on GB, CloudFront sends `CloudFront-Viewer-Country`.
 *
 * CloudFront wins outright where present, never merged with the other.
 * `x-blocked-paths` is an ordinary header any client can send, forwarded to
 * the origin but absent from the cache key, so honouring it behind CloudFront
 * would let one forged request cache the restricted page under an ordinary
 * viewer's key for the 60s s-maxage. `CloudFront-Viewer-Country` is generated
 * by CloudFront, unforgeable, and keyed on.
 *
 * `=== 'GB'` rather than an inverted test: an absent header must mean "not
 * restricted", never "restrict everyone".
 */
function resolveBlockedPaths(c: Context): string | undefined {
  const cloudfrontCountry = c.req.header('cloudfront-viewer-country')
  if (cloudfrontCountry) {
    return cloudfrontCountry === 'GB' ? '/' : undefined
  }
  return c.req.header('x-blocked-paths')
}

export async function metaTagInjectionMiddleware(c: Context, next: Next): Promise<Response> {
  const requestURL = new URL(c.req.url)
  const pathname = stripTrailingSlash(requestURL.pathname)
  // Single og:url per page: trailing-slash variants must not split share counts / preview caches.
  const canonicalUrl = requestURL.origin + pathname

  // Also check the raw pathname: wildcard entries like /vote/* only match /vote/ before normalization.
  if (!doesMatchPath(pathname) && !doesMatchPath(requestURL.pathname)) {
    await next()
    return c.res
  }

  try {
    await next()
    const originalResponse = c.res

    const contentType = originalResponse.headers.get('content-type')
    if (originalResponse.status !== 200 || !contentType?.includes('text/html')) {
      return originalResponse
    }

    // Clone the response to avoid consuming the body
    const clonedResponse = originalResponse.clone()
    const html = await clonedResponse.text()

    const exploreData = parseExplorePath(pathname)
    const positionData = parsePositionPath(pathname)
    let data: MetaTagInjectorInput

    if (exploreData) {
      const origin = requestURL.origin
      const exploreMeta = await withTimeout(
        fetchExploreData({
          type: exploreData.type,
          networkName: exploreData.networkName,
          address: exploreData.address,
          origin,
          requestUrl: canonicalUrl,
        }),
        { timeoutMs: META_TAG_FETCH_TIMEOUT_MS, errorMsg: 'fetchExploreData timeout' },
      ).catch(() => null)

      if (!exploreMeta) {
        return originalResponse
      }

      data = exploreMeta
    } else if (positionData) {
      const origin = requestURL.origin
      const positionMeta = await withTimeout(
        fetchPositionData({
          version: positionData.version,
          chainName: positionData.chainName,
          identifier: positionData.identifier,
          origin,
          requestUrl: canonicalUrl,
        }),
        { timeoutMs: META_TAG_FETCH_TIMEOUT_MS, errorMsg: 'fetchPositionData timeout' },
      ).catch(() => null)

      if (!positionMeta) {
        return originalResponse
      }

      data = positionMeta
    } else if (pathname === '/launches') {
      // English on purpose (like the default card below): crawlers read OG tags once per URL and don't reliably send Accept-Language.
      data = {
        title: 'Token launches on Uniswap',
        image: defaultImageUri(requestURL.origin),
        url: canonicalUrl,
        description: 'Discover and trade new token launches across launchpads, all in one place.',
      }
    } else {
      data = {
        title: 'Uniswap Interface',
        image: defaultImageUri(requestURL.origin),
        url: canonicalUrl,
        description:
          'Swap crypto on Ethereum, Base, Arbitrum, Polygon, Unichain and more. The DeFi platform trusted by millions.',
      }
    }

    const blockedPaths = resolveBlockedPaths(c)
    const metaTags = generateMetaTags(data, blockedPaths)

    const modifiedHtml = html.replace('</head>', `${metaTags}</head>`)

    return new Response(modifiedHtml, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: originalResponse.headers,
    })
  } catch {
    // next() has already been called, so we can just return the original response
    return c.res
  }
}
