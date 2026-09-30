import { PROD_ENTRY_GATEWAY_API_BASE_URL } from '@universe/api'

// Overridable so the cloud-function tests replay canned responses from the local fixture server.
// Gated to loopback like the liquidity override so a stray env value can't reroute prod traffic.
function resolveBaseUrl(): string {
  const override = process.env.CLOUD_FUNCTIONS_DATA_API_ENDPOINT_OVERRIDE
  if (override) {
    try {
      const { hostname } = new URL(override)
      if (hostname === '127.0.0.1' || hostname === 'localhost') {
        return override
      }
    } catch {
      // fall through to the prod gateway on a malformed override
    }
  }
  return PROD_ENTRY_GATEWAY_API_BASE_URL
}

const DATA_API_BASE_URL = resolveBaseUrl()

/**
 * Connect-over-HTTP unary call to the data-api v2 service behind the entry gateway (keyless), JSON
 * codec — the response body is the bare message. A non-2xx status or a thrown error collapses to
 * undefined so an unknown token degrades to the default meta tags rather than a 500.
 */
export async function dataApiServicePost<T>(method: string, body: object): Promise<T | undefined> {
  try {
    const response = await fetch(`${DATA_API_BASE_URL}/data.v2.DataApiService/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connect-Protocol-Version': '1',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      console.error(`[dataApiService] ${method} failed with status ${response.status}`)
      return undefined
    }
    return (await response.json()) as T
  } catch (error) {
    console.error(`[dataApiService] ${method} request errored`, error)
    return undefined
  }
}
