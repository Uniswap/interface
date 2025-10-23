import { Data } from 'functions/utils/cache'
import getPool from 'functions/utils/getPool'
import { getRequest } from 'functions/utils/getRequest'
import getToken from 'functions/utils/getToken'
import { Context, Next } from 'hono'
import { encode } from 'html-entities'
import { MetaTagInjectorInput } from 'shared-cloud/metatags'
import { paths } from 'src/pages/paths'

function doesMatchPath(path: string): boolean {
  const regexPaths = paths.map((p) => '^' + p.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$')
  // These come from a constant we define (paths.ts), so we don't need to worry about them being malicious.
  // eslint-disable-next-line security/detect-non-literal-regexp
  return regexPaths.some((regex) => new RegExp(regex).test(path))
}

function parseExplorePath(pathname: string): { type: 'token' | 'pool'; networkName: string; address: string } | null {
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
  return null
}

// eslint-disable-next-line max-params
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
  type: 'token' | 'pool'
  networkName: string
  address: string
  origin: string
  requestUrl: string
}): Promise<MetaTagInjectorInput | null> {
  const cacheUrl = `${origin}/${type}s/${networkName}/${address}`

  const validateDataToken = (data: Data): data is NonNullable<Awaited<ReturnType<typeof getToken>>> =>
    Boolean(data.tokenData?.symbol && data.name)

  const validateDataPool = (data: Data): data is NonNullable<Awaited<ReturnType<typeof getPool>>> => Boolean(data.title)

  const data = await getRequest({
    url: cacheUrl,
    getData: () =>
      type === 'token'
        ? getToken({ networkName, tokenAddress: address, url: cacheUrl })
        : getPool({ networkName, poolAddress: address, url: cacheUrl }),
    validateData: type === 'token' ? validateDataToken : validateDataPool,
  })

  return data ? { title: data.title, image: data.image, url: requestUrl } : null
}

export async function metaTagInjectionMiddleware(c: Context, next: Next): Promise<Response> {
  const requestURL = new URL(c.req.url)

  if (!doesMatchPath(requestURL.pathname)) {
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

    const exploreData = parseExplorePath(requestURL.pathname)
    let data: MetaTagInjectorInput

    if (exploreData) {
      const origin = requestURL.origin
      const exploreMeta = await fetchExploreData({
        type: exploreData.type,
        networkName: exploreData.networkName,
        address: exploreData.address,
        origin,
        requestUrl: c.req.url,
      })

      if (!exploreMeta) {
        return originalResponse
      }

      data = exploreMeta
    } else {
      const imageUri = requestURL.origin + '/images/1200x630_Rich_Link_Preview_Image.png'
      data = {
        title: 'Uniswap Interface',
        image: imageUri,
        url: c.req.url,
        description:
          'Swap crypto on Ethereum, Base, Arbitrum, Polygon, Unichain and more. The DeFi platform trusted by millions.',
      }
    }

    const blockedPaths = c.req.header('x-blocked-paths')
    const metaTags = generateMetaTags(data, blockedPaths)

    const modifiedHtml = html.replace('</head>', `${metaTags}</head>`)

    return new Response(modifiedHtml, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: originalResponse.headers,
    })
  } catch (_e) {
    // next() has already been called, so we can just return the original response
    return c.res
  }
}
