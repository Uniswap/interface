import { ORDERED_EVM_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { RPCType } from 'uniswap/src/features/chains/types'

/**
 * `rpcUrls[RPCType.Default]` is read by wallet-connector SDKs (wagmi's walletConnect
 * and Binance w3w connectors build their provider rpc maps from `default.http[0]`)
 * and fetched by cookieless in-page HTTP clients. Keyed provider URLs here leak the
 * API key into third-party traffic and break connected users when the keyed
 * endpoints are disabled. Keep Default unkeyed/public — keyed endpoints belong in
 * the app-routed types (Public/Interface) that resolve through UniRPC on web.
 */
const KEYED_PROVIDER_PATTERNS: RegExp[] = [
  /quiknode\.pro/i,
  /infura\.io/i,
  // Alchemy keyed paths (/v2/<key>); the unkeyed `/public` tier is allowed.
  /alchemy\.com\/v2/i,
]

describe('RPCType.Default URLs', () => {
  it.each(ORDERED_EVM_CHAINS.map((chain) => [chain.name, chain] as const))(
    '%s Default rpc urls contain no keyed provider endpoints',
    (_name, chain) => {
      const defaultUrls = chain.rpcUrls[RPCType.Default].http
      for (const url of defaultUrls) {
        for (const pattern of KEYED_PROVIDER_PATTERNS) {
          expect(url).not.toMatch(pattern)
        }
      }
    },
  )
})
