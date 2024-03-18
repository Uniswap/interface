import { INFURA_PREFIX_TO_CHAIN_ID } from 'constants/networks'
import { CHAIN_ID_TO_BACKEND_NAME } from 'graphql/data/util'
import { TraceContext } from 'tracing/types'
import { Chain } from '../graphql/data/__generated__/types-and-hooks'
import { trace as startTrace } from './trace'

export function patchFetch(api: Pick<typeof globalThis, 'fetch'>) {
  const apiFetch = api.fetch
  api.fetch = tracedFetch

  function tracedFetch(input: RequestInfo, init?: RequestInit): Promise<Response>
  function tracedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
  function tracedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const zonedTrace = Zone.current.get('trace')
    let url
    try {
      // Hot-module reload passes a relative path to a local file, which is a technically malformed URL.
      url = new URL(typeof input === 'string' ? input : 'url' in input ? input.url : input)
    } catch {
      return apiFetch(input, init)
    }
    const traceContext = getTraceContext(url, init, !!zonedTrace)
    if (traceContext) {
      const trace = zonedTrace || startTrace
      return trace(traceContext, async (trace) => {
        const response = await apiFetch(input, init)
        trace.setStatus(response.status)
        if (is2xx(response.status)) {
          try {
            // Check for 200 responses which wrap an error
            const json = await response.clone().json()
            const error = json.error ?? json.errors
            if (error) {
              trace.setError(error)
            }
          } catch {
            // ignore the error
          }
        } else {
          try {
            const text = await response.clone().text()
            try {
              // Try to set a structured error, if possible.
              trace.setError(JSON.parse(text))
            } catch (e) {
              trace.setError(text)
            }
          } catch {
            trace.setError(response.statusText)
          }
        }
        return response
      })
    } else {
      return apiFetch(input, init)
    }
  }
}

function is2xx(status: number) {
  return status >= 200 && status < 300
}

export function getTraceContext(url: URL, init?: RequestInit, force = false): TraceContext | false {
  if (url.host.endsWith('gateway.uniswap.org')) {
    if (url.pathname.endsWith('graphql')) {
      let operation: string | undefined
      let chain: Chain | undefined
      let address: string | undefined
      try {
        const body = JSON.parse(init?.body as string) as {
          operationName: string
          variables: { chain?: Chain; address?: string }
        }
        operation = body.operationName
        chain = body.variables?.chain
        address = body.variables?.address
      } catch {
        // ignore the error
      }
      return {
        name: `${url.host} ${operation}`,
        op: 'http.graphql.query',
        tags: { host: url.host, operation, chain, address },
      }
    } else {
      return {
        name: `${url.host} ${url.pathname}`,
        op: 'http.client',
        tags: { host: url.host },
        data: { path: url.pathname },
      }
    }
  } else if (url.host.endsWith('.infura.io')) {
    let method: string | undefined
    let chain: Chain | undefined
    try {
      const body = JSON.parse(Buffer.from(init?.body as Uint8Array).toString())
      method = body.method
      const chainId = INFURA_PREFIX_TO_CHAIN_ID[url.host.split('.')[0]]
      chain = chainId && CHAIN_ID_TO_BACKEND_NAME[chainId]
    } catch {
      // ignore the error
    }
    return { name: `${url.host} ${method}`, op: 'http.json_rpc', tags: { host: url.host, method, chain } }
  } else if (force) {
    return {
      name: `${url.host} ${url.pathname}`,
      op: 'http.client',
      tags: { host: url.host },
      data: { path: url.pathname },
    }
  } else {
    return false
  }
}
