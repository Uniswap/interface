import { OPENSEA_BASE_API_PATH } from 'nft/queries/openSea'

export async function PostOpenSeaSellOrder<T>(payload?: Record<string, unknown>): Promise<boolean> {
  const body = payload ? JSON.stringify(payload) : undefined
  const url = `http://localhost:5001/postOpenSeaSellOrderWithApiKey` // TODO update endpoint
  // const url = `${process.env.REACT_APP_GENIE_V3_API_URL}/postOpenSeaSellOrderWithApiKey`
  const ac = new AbortController()
  const req = new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body,
    signal: ac.signal,
  })
  const timeout = setTimeout(() => ac.abort(), 60 * 1000)
  try {
    const res = await fetch(req)
    const data = await res.json()
    console.log(data.code)
    return data.code === 200
  } catch (e) {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

async function _fetch(apiPath: string, opts: RequestInit = {}) {
  const apiBase = OPENSEA_BASE_API_PATH
  const finalUrl = apiBase + apiPath
  const finalOpts = {
    ...opts,
    headers: {
      ...(opts.headers || {}),
    },
  }

  return fetch(finalUrl, finalOpts).then(async (res) => _handleApiResponse(res))
}

async function _handleApiResponse(response: Response) {
  if (response.ok) {
    return response
  }

  let result
  let errorMessage
  try {
    result = await response.text()
    result = JSON.parse(result)
  } catch {
    // Result will be undefined or text
  }

  switch (response.status) {
    case 400:
      errorMessage = result && result.errors ? result.errors.join(', ') : `Invalid request: ${JSON.stringify(result)}`
      break
    case 401:
    case 403:
      errorMessage = `Unauthorized. Full message was '${JSON.stringify(result)}'`
      break
    case 404:
      errorMessage = `Not found. Full message was '${JSON.stringify(result)}'`
      break
    case 500:
      errorMessage = `Internal server error. OpenSea has been alerted, but if the problem persists please contact us via Discord: https://discord.gg/ga8EJbv - full message was ${JSON.stringify(
        result
      )}`
      break
    case 503:
      errorMessage = `Service unavailable. Please try again in a few minutes. If the problem persists please contact us via Discord: https://discord.gg/ga8EJbv - full message was ${JSON.stringify(
        result
      )}`
      break
    default:
      errorMessage = `Message: ${JSON.stringify(result)}`
      break
  }

  throw new Error(`API Error ${response.status}: ${errorMessage}`)
}
