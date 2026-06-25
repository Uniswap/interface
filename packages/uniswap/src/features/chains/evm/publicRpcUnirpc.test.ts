import { ORDERED_EVM_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { RPCType } from 'uniswap/src/features/chains/types'

/**
 * `rpcUrls[RPCType.Public]` is the primary public endpoint for each chain — the
 * URL the resolver's legacy/fallback branch returns and that direct chain-info
 * readers use. Every EVM chain must route it through the UniRPC gateway, never
 * QuickNode directly. The runtime resolver already prefers UniRPC when the gate
 * is on; this pins the static config so a QuickNode URL can't slip back into the
 * public path on any chain.
 *
 * UniRPC does not route Solana yet (SVM, not in ORDERED_EVM_CHAINS), so it stays
 * on QuickNode and is intentionally out of scope here.
 */
describe('RPCType.Public routes through UniRPC, not QuickNode', () => {
  it.each(ORDERED_EVM_CHAINS.map((chain) => [chain.name, chain] as const))(
    '%s Public rpc urls use the UniRPC gateway',
    (_name, chain) => {
      const publicUrls = chain.rpcUrls[RPCType.Public].http
      for (const url of publicUrls) {
        expect(url).not.toMatch(/quiknode\.pro/i)
      }
    },
  )
})
