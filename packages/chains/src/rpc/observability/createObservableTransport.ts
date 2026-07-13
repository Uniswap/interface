import { Chain, ClientConfig, EIP1193RequestFn, Transport, TransportConfig } from 'viem'
import { extractRpcErrorMeta } from './extractRpcErrorMeta'
import { generateRequestId, type RpcObserver } from './rpcObserver'

export function createObservableTransport({
  baseTransportFactory,
  observer,
  meta,
}: {
  baseTransportFactory: Transport
  observer: RpcObserver
  meta: { chainId: number; url: string }
}): Transport {
  return (<chain extends Chain | undefined = Chain>(config: {
    chain?: chain
    pollingInterval?: ClientConfig['pollingInterval']
    retryCount?: TransportConfig['retryCount']
    timeout?: TransportConfig['timeout']
  }) => {
    const baseTransport = baseTransportFactory(config)

    const request: EIP1193RequestFn = (async ({ method, params }: { method: string; params?: unknown }) => {
      const requestId = generateRequestId()
      const ctx = { requestId, method, params, chainId: meta.chainId, url: meta.url, transport: 'viem' as const }

      observer.onRequest(ctx)
      const start = performance.now()

      try {
        const result = await baseTransport.request({ method, params } as Parameters<EIP1193RequestFn>[0])
        observer.onResponse({ ...ctx, durationMs: performance.now() - start })
        return result
      } catch (error) {
        // viem throws raw HttpRequestError (`.status`) / RpcError (`.code`) here —
        // extract before they're flattened to a message string downstream.
        observer.onError({ ...ctx, durationMs: performance.now() - start, error, ...extractRpcErrorMeta(error) })
        throw error
      }
    }) as EIP1193RequestFn

    return {
      ...baseTransport,
      request,
      value: undefined,
    }
  }) as Transport
}
