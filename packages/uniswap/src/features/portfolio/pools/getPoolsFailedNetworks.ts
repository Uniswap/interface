import type { AppTFunction } from 'ui/src/i18n/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'

export const MAX_NAMED_FAILED_NETWORKS = 3

function joinWithConjunction(parts: string[]): string {
  if (parts.length <= 1) {
    return parts.join('')
  }
  const last = parts.at(-1) ?? ''
  const rest = parts.slice(0, -1)
  return rest.length === 1 ? `${rest.join('')} and ${last}` : `${rest.join(', ')}, and ${last}`
}

function getFailedNetworksLabel({ chainIds, t }: { chainIds: UniverseChainId[]; t: AppTFunction }): string {
  const labels = chainIds.map(getChainLabel)
  if (labels.length <= MAX_NAMED_FAILED_NETWORKS) {
    return joinWithConjunction(labels)
  }
  const overflow = t('portfolio.pools.unavailable.otherNetworks', { count: labels.length - MAX_NAMED_FAILED_NETWORKS })
  return joinWithConjunction([...labels.slice(0, MAX_NAMED_FAILED_NETWORKS), overflow])
}

export function getPoolsUnavailableMessage({ chainIds, t }: { chainIds: UniverseChainId[]; t: AppTFunction }): string {
  if (chainIds.length === 0) {
    return ''
  }
  return t('portfolio.pools.unavailable.networks', { networks: getFailedNetworksLabel({ chainIds, t }) })
}
