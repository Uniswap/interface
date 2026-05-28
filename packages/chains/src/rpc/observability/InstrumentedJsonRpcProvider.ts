import { Networkish, StaticJsonRpcProvider } from '@ethersproject/providers'
import { normalizeRpcError } from './normalizeRpcError'
import { generateRequestId, type RpcObserver } from './rpcObserver'

export class InstrumentedJsonRpcProvider extends StaticJsonRpcProvider {
  private observer: RpcObserver
  private chainIdNum: number
  private rpcUrl: string

  constructor({
    url,
    headers,
    credentials,
    chainIdOrNetwork,
    observer,
  }: {
    url: string | undefined
    headers?: Record<string, string>
    /**
     * Fetch credentials mode for cross-origin UniRPC traffic. Without this,
     * ethers' default is `same-origin` and the browser drops cookies on
     * cross-origin requests — silently breaking cookie-based session auth on
     * web (e.g. ENS, portfolio, gas-estimate paths).
     */
    credentials?: 'include'
    chainIdOrNetwork: Networkish
    observer: RpcObserver
  }) {
    // ethers' StaticJsonRpcProvider accepts either a string URL or a ConnectionInfo
    // object. Use ConnectionInfo when headers or credentials are present so
    // UniRPC's static auth headers (e.g. x-request-source) and cookie credentials
    // flow through the underlying fetch.
    //
    // Credentials must go via `fetchOptions.credentials` — ConnectionInfo has no
    // top-level `credentials` field. See @ethersproject/web's browser-geturl.ts:
    // it reads `options.fetchOptions.credentials` and forwards to the fetch
    // RequestInit.
    const connection =
      headers || credentials
        ? {
            url: url ?? '',
            headers,
            fetchOptions: credentials ? { credentials } : undefined,
          }
        : url
    super(connection, chainIdOrNetwork)
    this.observer = observer
    this.chainIdNum =
      typeof chainIdOrNetwork === 'number'
        ? chainIdOrNetwork
        : typeof chainIdOrNetwork === 'object' && 'chainId' in chainIdOrNetwork
          ? chainIdOrNetwork.chainId
          : 0
    this.rpcUrl = url ?? ''
  }

  async perform(method: string, params: Record<string, unknown>): Promise<unknown> {
    const requestId = generateRequestId()
    const ctx = {
      requestId,
      method,
      params,
      chainId: this.chainIdNum,
      url: this.rpcUrl,
      transport: 'ethers' as const,
    }

    this.observer.onRequest(ctx)
    const start = performance.now()

    try {
      const result: unknown = await super.perform(method, params)
      this.observer.onResponse({ ...ctx, durationMs: performance.now() - start })
      return result
    } catch (error) {
      // Normalize before handing to the observer — ethers wraps RPC errors in
      // a verbose envelope that embeds per-request fields (id, body, url) into
      // the message string, defeating the rate limiter's bucket-by-message
      // strategy. Throw the original error so call sites still see ethers'
      // shape (some downstream code keys on `.code`, `.serverError`, etc.).
      this.observer.onError({ ...ctx, durationMs: performance.now() - start, error: normalizeRpcError(error) })
      throw error
    }
  }
}
