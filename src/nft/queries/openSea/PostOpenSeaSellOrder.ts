import { OPENSEA_BASE_API_PATH } from 'nft/queries/openSea'

export async function PostOpenSeaSellOrder<T>(
  apiPath: string,
  body?: Record<string, unknown>,
  opts: RequestInit = {}
): Promise<T> {
  const fetchOpts = {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.REACT_APP_OPENSEA_API_KEY ?? '',
    },
    ...opts,
  }

  const response = await _fetch(apiPath, fetchOpts)
  return response.json()
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
