import { V2_ROUTER_ADDRESSES } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Base list of chain IDs that support Uniswap V2-style pools via sdk-core.
 * Combined with NETWORKS_V2_ONLY (see pages/LegacyPool/redirects.tsx), controls:
 * - Which networks show on **V2** vs **FewV2** create/find pages
 * - /positions import copy: "Few V2: ..." list is this array minus NETWORKS_V2_ONLY
 *
 * @deprecated when v2 pools are enabled on chains supported through sdk-core
 */
const BASE_SUPPORTED_V2POOL_CHAIN_IDS = Object.keys(V2_ROUTER_ADDRESSES).map((chainId) => parseInt(chainId))

/** All chains that support FewV2. Used for FewV2 create/find and /positions "Few V2" list. */
export const SUPPORTED_V2POOL_CHAIN_IDS = Array.from(
  new Set([
    ...BASE_SUPPORTED_V2POOL_CHAIN_IDS,
    UniverseChainId.Sepolia,
    UniverseChainId.HyperMainnet,
    UniverseChainId.MEGAETHMainnet,
    UniverseChainId.Bnb,
  ]),
)

export function useNetworkSupportsV2() {
  const { chainId } = useAccount()

  return chainId && SUPPORTED_V2POOL_CHAIN_IDS.includes(chainId)
}
