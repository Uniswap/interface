import { renderPoolOgImage } from 'functions/api/image/pools'
import { IMAGE_DATA_FETCH_TIMEOUT_MS } from 'functions/constants'
import getPosition from 'functions/utils/getPosition'
import { getRequest } from 'functions/utils/getRequest'
import { type Context } from 'hono'
import { withTimeout } from 'uniswap/src/utils/polling'

export async function positionImageHandler(c: Context) {
  try {
    const { version, chainName, identifier } = c.req.param()
    const origin = new URL(c.req.url).origin

    const cacheUrl = `${origin}/positions/${version}/${chainName}/${identifier}`
    // See tokenImageHandler / metaTagInjector for full context: cap upstream
    // hangs to avoid a CF Worker Error 1101 (500). Falls through to 404.
    const data = await withTimeout(
      getRequest({
        url: cacheUrl,
        getData: () =>
          getPosition({
            version: version as 'v2' | 'v3' | 'v4',
            chainName,
            identifier,
            url: cacheUrl,
          }),
        validateData: (data): data is NonNullable<Awaited<ReturnType<typeof getPosition>>> => Boolean(data.title),
      }),
      { timeoutMs: IMAGE_DATA_FETCH_TIMEOUT_MS, errorMsg: 'positionImageHandler getPosition timeout' },
    ).catch(() => null)

    if (!data) {
      return new Response('Position not found.', { status: 404 })
    }

    return renderPoolOgImage({
      data,
      networkName: chainName,
      c,
      versionBadge: data.poolData?.protocolVersion,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(message, { status: 500 })
  }
}
