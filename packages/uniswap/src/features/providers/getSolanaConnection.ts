import { Connection } from '@solana/web3.js'
import { generateRequestId, getRpcObserver } from '@universe/chains'
import { SOLANA_CHAIN_INFO } from 'uniswap/src/features/chains/svm/info/solana'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const SOLANA_RPC_URL = SOLANA_CHAIN_INFO.rpcUrls.default.http[0]

/**
 * Instrument every Solana JSON-RPC request via the same observer pipeline as
 * EVM (`@universe/chains`'s `getRpcObserver`). Datadog dashboards key off
 * observer log lines — without this wrapper, every Solana balance lookup and
 * token-account query is a dark RPC call (no metrics, no rate-limit summaries,
 * no error categorization).
 *
 * Note: UniRPC itself is EVM-only (per backend `unirpc-v2/src/core/util/chains.ts`
 * — the chain enum has no Solana entry, the forwarder is `EthRpcForwarder`).
 * So Solana traffic targets the configured Solana RPC URL directly. The
 * boundary closing here is observability, not gateway routing.
 *
 * The custom `fetch` config option is a clean instrumentation point — Solana's
 * `Connection` calls our wrapped `fetch` instead of the global one for every
 * JSON-RPC call. We tag `transport: 'solana'` so dashboards can filter.
 */
const SOLANA_CONNECTION = new Connection(SOLANA_RPC_URL, {
  fetch: async (input, init) => {
    const observer = getRpcObserver()
    const requestId = generateRequestId()

    let method = 'unknown'
    if (init?.body && typeof init.body === 'string') {
      try {
        const parsed = JSON.parse(init.body) as { method?: unknown }
        if (typeof parsed.method === 'string') {
          method = parsed.method
        }
      } catch {
        // Body isn't JSON — leave method as 'unknown'.
      }
    }

    const ctx = {
      requestId,
      method,
      params: undefined,
      chainId: UniverseChainId.Solana,
      url: SOLANA_RPC_URL,
      transport: 'solana' as const,
    }

    observer.onRequest(ctx)
    const start = performance.now()
    try {
      const response = await fetch(input, init)
      observer.onResponse({ ...ctx, durationMs: performance.now() - start })
      return response
    } catch (error) {
      observer.onError({ ...ctx, durationMs: performance.now() - start, error })
      throw error
    }
  },
})

export function getSolanaConnection(): Connection {
  return SOLANA_CONNECTION
}
