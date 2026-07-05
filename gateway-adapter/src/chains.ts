/**
 * Per-chain config for the HookSwap gateway-schema adapter.
 *
 * Maps the interface's two chain identifiers — the numeric EVM chainId AND the gateway GraphQL
 * `Chain` enum name (e.g. ROBINHOOD, ETHEREUM_SEPOLIA) — to the self-hosted v3-subgraph GraphQL
 * URL for that chain.
 *
 * Sources of truth:
 *   - Chain enum names: packages/api/src/clients/graphql/schema.graphql `enum Chain`.
 *   - chainIds + which chains HookSwap deploys on: HookSwap/CLAUDE.md LOCKED DECISIONS + trading-api-adapter/src/chains.ts.
 *   - Subgraph URL pattern + <chain> slugs: v3-subgraph/hookswap/SELF-HOST.md §4
 *     (`http://graph-node:8000/subgraphs/name/hookswap-v3-<chain>`).
 *
 * The interface sends operations keyed by the `Chain` enum (e.g. `topV3Pools(chain: ROBINHOOD ...)`),
 * so resolvers look chains up by enum name; the numeric chainId is used to read the SUBGRAPH_URL_<id>
 * env var and to emit the numeric `chainId` fields the interface expects where relevant.
 */

/** Gateway GraphQL `Chain` enum values HookSwap serves from its own subgraphs. */
export type GatewayChain =
  | 'ETHEREUM_SEPOLIA'
  | 'INK'
  | 'MEGAETH'
  | 'ROBINHOOD'
  | 'XLAYER'
  | 'HYPEREVM'
  | 'TEMPO'

export interface ChainConfig {
  chainId: number
  /** gateway GraphQL `Chain` enum name the interface uses in query variables. */
  gatewayChain: GatewayChain
  /** short slug used in the subgraph deployment name `hookswap-v3-<slug>` (SELF-HOST.md §4). */
  subgraphSlug: string
  /** env var carrying this chain's subgraph GraphQL URL. */
  subgraphEnvVar: string
}

/**
 * NOTE: `HYPEREVM` is not yet a member of the committed `enum Chain` in schema.graphql (that enum
 * lists XLAYER/MEGAETH/TEMPO/ROBINHOOD but not HyperEVM — HyperEVM was added interface-side as a
 * UniverseChainId only). If/when HyperEVM (999) queries flow through the gateway path, add
 * `HYPEREVM` to the served schema.graphql `enum Chain` too, or those queries will fail validation
 * and fall through to the upstream proxy. Kept here so the mapping is complete and ready.
 */
export const CHAINS: ChainConfig[] = [
  { chainId: 11155111, gatewayChain: 'ETHEREUM_SEPOLIA', subgraphSlug: 'sepolia', subgraphEnvVar: 'SUBGRAPH_URL_11155111' },
  { chainId: 57073, gatewayChain: 'INK', subgraphSlug: 'ink', subgraphEnvVar: 'SUBGRAPH_URL_57073' },
  { chainId: 4326, gatewayChain: 'MEGAETH', subgraphSlug: 'megaeth', subgraphEnvVar: 'SUBGRAPH_URL_4326' },
  { chainId: 4663, gatewayChain: 'ROBINHOOD', subgraphSlug: 'robinhood', subgraphEnvVar: 'SUBGRAPH_URL_4663' },
  { chainId: 196, gatewayChain: 'XLAYER', subgraphSlug: 'xlayer', subgraphEnvVar: 'SUBGRAPH_URL_196' },
  { chainId: 999, gatewayChain: 'HYPEREVM', subgraphSlug: 'hyperevm', subgraphEnvVar: 'SUBGRAPH_URL_999' },
  { chainId: 4217, gatewayChain: 'TEMPO', subgraphSlug: 'tempo', subgraphEnvVar: 'SUBGRAPH_URL_4217' },
]

const BY_CHAIN_ENUM = new Map<string, ChainConfig>(CHAINS.map((c) => [c.gatewayChain, c]))
const BY_CHAIN_ID = new Map<number, ChainConfig>(CHAINS.map((c) => [c.chainId, c]))

export function getChainByEnum(chain: string | undefined | null): ChainConfig | undefined {
  if (!chain) {
    return undefined
  }
  return BY_CHAIN_ENUM.get(chain)
}

export function getChainById(chainId: number): ChainConfig | undefined {
  return BY_CHAIN_ID.get(chainId)
}

/**
 * Resolve the subgraph GraphQL URL for a chain from env. Returns undefined if this chain has no
 * SUBGRAPH_URL_<id> configured — the caller then falls back to the upstream proxy (never fabricates).
 */
export function resolveSubgraphUrl(chain: ChainConfig): string | undefined {
  const url = process.env[chain.subgraphEnvVar]
  return url && url.trim().length > 0 ? url.trim() : undefined
}

/** True if we have a subgraph URL configured for the given gateway Chain enum value. */
export function isSubgraphServeableChain(chain: string | undefined | null): boolean {
  const cfg = getChainByEnum(chain)
  return Boolean(cfg && resolveSubgraphUrl(cfg))
}
