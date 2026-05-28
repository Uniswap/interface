import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { ALL_NETWORKS_LABEL, type UniverseEventProperties } from 'uniswap/src/features/telemetry/types'

export type NetworkFilterSelectedChainFields = Pick<
  UniverseEventProperties[typeof UniswapEventName.NetworkFilterSelected],
  'chain' | 'chain_name'
>

/** Shared `chain` + `chain_name` payload for {@link UniswapEventName.NetworkFilterSelected}. */
export function buildNetworkFilterSelectedChainFields(
  chainId: UniverseChainId | null | undefined,
): NetworkFilterSelectedChainFields {
  if (!chainId) {
    return { chain: ALL_NETWORKS_LABEL, chain_name: ALL_NETWORKS_LABEL }
  }
  return {
    chain: chainId,
    chain_name: getChainLabel(chainId),
  }
}
