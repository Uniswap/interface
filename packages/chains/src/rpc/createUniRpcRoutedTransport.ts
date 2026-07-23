import { Chain, ClientConfig, createTransport, EIP1193RequestFn, Transport, TransportConfig } from 'viem'
import type { RpcConfig } from './rpcUrlSelector'

/**
 * A viem Transport that resolves its routing — UniRPC vs the legacy provider
 * set — *per request*, by re-reading `resolveRpcConfig` live rather than
 * snapshotting it at construction.
 *
 * Why this belongs in the seam (not as adapter glue): viem clients are built
 * once and cached for the session by their framework (wagmi caches
 * `client({chain})`). The routing input is a feature gate that resolves
 * asynchronously after app start, so a choice frozen at build time pins the
 * chain to whatever was true before the gate loaded — usually the legacy
 * providers — for the whole session, even after the gate turns on. Consumers
 * that own client *access* (`ViemClientManager.getViemClient`) already avoid
 * this by re-resolving per call; this transport gives the same guarantee to
 * consumers that can't re-resolve (framework-cached clients), without a rebuild.
 *
 * Separation of concerns / DI: this owns only the *select-per-request, memoize,
 * delegate* mechanism. The routing decision (`resolveRpcConfig` — the port) and
 * the construction of each branch (session strategy, observability wrapping,
 * fallback URL ordering) are injected by the boundary, so this stays
 * platform-agnostic and unit-testable without wagmi, Statsig, or a network.
 *
 * Each branch's transport is built lazily and reused: the decision is re-read
 * every request, but construction happens at most once per branch, and a branch
 * that is never selected is never built.
 */
export function createUniRpcRoutedTransport({
  resolveRpcConfig,
  buildUniRpcTransport,
  buildLegacyTransport,
}: {
  /** The routing port, pre-bound to a (chainId, rpcType). Re-read per request. */
  resolveRpcConfig: () => RpcConfig | null
  /** Builds the UniRPC transport from the resolved UniRPC config. Invoked at most once. */
  buildUniRpcTransport: (config: RpcConfig) => Transport
  /** Builds the legacy transport (e.g. a multi-URL fallback). Invoked at most once. */
  buildLegacyTransport: () => Transport
}): Transport {
  return (<chain extends Chain | undefined = Chain>(config: {
    chain?: chain
    pollingInterval?: ClientConfig['pollingInterval']
    retryCount?: TransportConfig['retryCount']
    timeout?: TransportConfig['timeout']
  }) => {
    let uniRpc: { request: EIP1193RequestFn } | undefined
    let legacy: { request: EIP1193RequestFn } | undefined

    const request: EIP1193RequestFn = (async (args: Parameters<EIP1193RequestFn>[0]) => {
      const rpcConfig = resolveRpcConfig()
      if (rpcConfig?.isUniRpc) {
        uniRpc ??= buildUniRpcTransport(rpcConfig)(config)
        return uniRpc.request(args)
      }
      legacy ??= buildLegacyTransport()(config)
      return legacy.request(args)
    }) as EIP1193RequestFn

    // retryCount is left to the caller's config (viem's default of 3) so the
    // client-level retry that wrapped the previous transport is preserved; the
    // inner transports keep their own failover (legacy `fallback`) and timeout
    // (UniRPC).
    return createTransport({
      key: 'uniRpcRouted',
      name: 'UniRPC-routed transport',
      type: 'uniRpcRouted',
      retryCount: config.retryCount,
      request,
    })
  }) as Transport
}
