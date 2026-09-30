import type { UniverseChainId } from '@universe/chains'
import { ExploreTab } from '~/types/explore'
import { getChainUrlParam } from '~/utils/params/chainParams'

/**
 * Explore's chain-in-path URL, `/explore/<tab>[/<chain>]`, carrying the current query string. The chain
 * segment is the single source of truth for a tab's network filter, so every network change routes here.
 */
export function buildExploreUrl({
  tabName,
  chainId,
  searchParams,
}: {
  tabName: ExploreTab | undefined
  chainId: UniverseChainId | undefined
  searchParams: URLSearchParams
}): string {
  const chainUrlParam = chainId ? getChainUrlParam(chainId) : ''
  const path = `/explore/${tabName ?? ExploreTab.Tokens}${chainId ? `/${chainUrlParam}` : ''}`
  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}
