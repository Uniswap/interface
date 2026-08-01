import { getEntryGatewayUrl } from '@universe/api'
import { config } from 'uniswap/src/config'
import { RetryOptions, RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

/** Address that represents native currencies on ETH, Arbitrum, etc. */
export const DEFAULT_NATIVE_ADDRESS_LEGACY = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
export const DEFAULT_NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000'
export const DEFAULT_RETRY_OPTIONS: RetryOptions = { n: 10, minWait: 250, medWait: 500, maxWait: 1000 }

export const DEFAULT_MS_BEFORE_WARNING = ONE_MINUTE_MS * 10

// Source: https://marketplace.quicknode.com/chains_and_networks

// Chains UniRPC doesn't route yet use a dedicated QuickNode endpoint (full URL,
// token included) sourced from env config rather than the shared multichain
// endpoint. Solana is configured via QUICKNODE_SOLANA_RPC_URL — removable once
// uni-rpc supports Solana. RPC tokens are client-visible by design, same as the
// shared endpoint token shipped in app bundles.
function getDedicatedQuicknodeEndpointUrl(chainId: UniverseChainId): string | undefined {
  switch (chainId) {
    case UniverseChainId.Solana: {
      // Only honor a fully-formed URL. optionalString config fields default to ''
      // when unset, and a non-URL placeholder value can reach CI/jest as a
      // literal value — both must fall through to the shared
      // multichain endpoint rather than become an invalid RPC URL (the Solana
      // Connection constructor throws on a non-http endpoint at module load).
      const solanaRpcUrl = config.quicknodeSolanaRpcUrl
      return /^https?:\/\//.test(solanaRpcUrl) ? solanaRpcUrl : undefined
    }
    default:
      return undefined
  }
}

export function getQuicknodeChainId(chainId: UniverseChainId): string {
  switch (chainId) {
    case UniverseChainId.Mainnet:
      return ''
    case UniverseChainId.ArbitrumOne:
      return 'arbitrum-mainnet'
    case UniverseChainId.Avalanche:
      return 'avalanche-mainnet'
    case UniverseChainId.Base:
      return 'base-mainnet'
    case UniverseChainId.Blast:
      return 'blast-mainnet'
    case UniverseChainId.Bnb:
      return 'bsc'
    case UniverseChainId.Celo:
      return 'celo-mainnet'
    case UniverseChainId.Linea:
      return 'linea-mainnet'
    case UniverseChainId.MegaETH:
      return 'megaeth-mainnet'
    case UniverseChainId.Monad:
      return 'monad-mainnet'
    case UniverseChainId.Optimism:
      return 'optimism'
    case UniverseChainId.Polygon:
      return 'matic'
    case UniverseChainId.Sepolia:
      return 'ethereum-sepolia'
    case UniverseChainId.Solana:
      return 'solana-mainnet'
    case UniverseChainId.Soneium:
      return 'soneium-mainnet'
    case UniverseChainId.Tempo:
      return 'tempo-mainnet'
    case UniverseChainId.Unichain:
      return 'unichain-mainnet'
    case UniverseChainId.UnichainSepolia:
      return 'unichain-sepolia'
    case UniverseChainId.WorldChain:
      return 'worldchain-mainnet'
    case UniverseChainId.XLayer:
      return 'xlayer-mainnet'
    case UniverseChainId.Zksync:
      return 'zksync-mainnet'
    case UniverseChainId.Zora:
      return 'zora-mainnet'
    default:
      throw new Error(`Chain ${chainId} does not have a corresponding QuickNode chain ID`)
  }
}

// If chain requires a path suffix
export function getQuicknodeChainIdPathSuffix(chainId: UniverseChainId): string {
  switch (chainId) {
    case UniverseChainId.Avalanche:
      return '/ext/bc/C/rpc' // https://www.quicknode.com/docs/avalanche#overview
    default:
      return ''
  }
}

export function getQuicknodeEndpointUrl(chainId: UniverseChainId): string {
  const dedicatedUrl = getDedicatedQuicknodeEndpointUrl(chainId)
  if (dedicatedUrl) {
    return dedicatedUrl
  }

  const quicknodeChainId = getQuicknodeChainId(chainId)

  return `https://${config.quicknodeEndpointName}${quicknodeChainId ? `.${quicknodeChainId}` : ''}.quiknode.pro/${config.quicknodeEndpointToken}${getQuicknodeChainIdPathSuffix(chainId)}`
}

// Direct UniRPC gateway URL for a chain — mirrors the resolver's `/rpc/{chainId}`
// construction. Used by chains UniRPC supports so their chain-info RPCs route
// through UniRPC instead of QuickNode, on web and wallet.
export function getUniRpcEndpointUrl(chainId: UniverseChainId): string {
  return `${getEntryGatewayUrl()}/rpc/${chainId}`
}

export function getPlaywrightRpcUrls(url: string): { [key in RPCType]: { http: string[] } } {
  return {
    [RPCType.Public]: { http: [url] },
    [RPCType.Default]: { http: [url] },
    [RPCType.Fallback]: { http: [url] },
    [RPCType.Interface]: { http: [url] },
    [RPCType.Private]: { http: [url] },
    [RPCType.PublicAlt]: { http: [url] },
  }
}
