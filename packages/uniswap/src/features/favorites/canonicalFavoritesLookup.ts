import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { normalizeTokenAddressForCache, UniverseChainId } from '@universe/chains'
import { normalizeBackendNativeAddress } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { CurrencyId } from 'uniswap/src/types/currency'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export type FavoritesCanonicalLookup = {
  /** Maps `${chainId}-${normalizedAddress}` → canonical CurrencyId (mainnet when multichain). */
  canonicalByKey: Map<string, CurrencyId>
  /** Maps `${chainId}-${normalizedAddress}` → number of chains the token exists on. */
  networkCountByKey: Map<string, number>
}

type Deployment = { chainId: UniverseChainId; address: string }

export function buildLookupKey({ chainId, address }: { chainId: number; address: string }): string {
  return `${chainId}-${normalizeTokenAddressForCache(address)}`
}

function getDeployments(addresses: Record<string, string>): Deployment[] {
  return Object.entries(addresses).map(([chainIdKey, address]) => {
    const chainId = Number(chainIdKey)
    return { chainId, address: normalizeBackendNativeAddress({ chainId, address }) }
  })
}

/**
 * Canonical deployment is mainnet when present, else the lowest chainId. Deliberately not the
 * highest-volume deployment Explore displays: the canonical CurrencyId is persisted as the stored
 * favorite, so it must not drift as volumes shift between sessions.
 */
function pickCanonicalDeployment(deployments: Deployment[]): Deployment | undefined {
  return (
    deployments.find((deployment) => deployment.chainId === UniverseChainId.Mainnet) ??
    deployments.reduce<Deployment | undefined>(
      (lowest, deployment) => (lowest && lowest.chainId <= deployment.chainId ? lowest : deployment),
      undefined,
    )
  )
}

/**
 * Builds canonical + network-count lookup maps from v2 ListTokens results.
 *
 * When the tokens come from an all-enabled-chains request, the output is stable regardless of any
 * Explore network filter. This enables two favorite-token behaviors:
 *  - `canonicalByKey` gives every chain-specific token the same canonical CurrencyId, preventing
 *    duplicate favorites for the same project across chains.
 *  - `networkCountByKey` lets us decide whether to hide the chain badge on a favorite card
 *    consistently (badge is hidden when a token exists on more than one chain).
 *
 * Tokens not represented in the list are intentionally absent from both maps; callers should
 * fall back gracefully (e.g. use the input currencyId as-is, show the chain badge).
 */
export function buildFavoritesCanonicalLookup(
  multichainTokens: readonly RankedMultichainToken[],
): FavoritesCanonicalLookup {
  const canonicalByKey = new Map<string, CurrencyId>()
  const networkCountByKey = new Map<string, number>()

  for (const rankedToken of multichainTokens) {
    const addresses = rankedToken.multichainToken?.addresses
    if (!addresses) {
      continue
    }

    const deployments = getDeployments(addresses)
    const canonical = pickCanonicalDeployment(deployments)
    if (!canonical) {
      continue
    }

    // Always emit a normalized canonical CurrencyId so downstream equality checks work regardless
    // of the case returned by the backend.
    const canonicalCurrencyId = normalizeCurrencyIdForMapLookup(buildCurrencyId(canonical.chainId, canonical.address))

    for (const deployment of deployments) {
      const key = buildLookupKey(deployment)
      canonicalByKey.set(key, canonicalCurrencyId)
      networkCountByKey.set(key, deployments.length)
    }
  }

  return { canonicalByKey, networkCountByKey }
}
