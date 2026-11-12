import { isEVMChain } from '@universe/chains'
import { GATING_URL_PARAMS } from '@universe/gating'
import { matchPath } from 'react-router'
import type { PoolAreaTab } from '~/features/Explore/poolArea/types'
import { buildExploreUrl } from '~/features/Explore/utils/buildExploreUrl'
import { ExploreTab } from '~/types/explore'
import { getChainIdFromChainUrlParam, getChainUrlParam } from '~/utils/params/chainParams'

export const SHARED_NAVIGATION_SEARCH_PARAMS: ReadonlySet<string> = new Set([
  'chain',
  'lng',
  ...Object.values(GATING_URL_PARAMS),
])

function withSearchParams(path: string, searchParams: URLSearchParams): string {
  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export function isPoolDiscoveryRoute(pathname: string): boolean {
  return Boolean(matchPath('/explore/pools/*', pathname) || matchPath('/explore/hooks/*', pathname))
}

export function isPoolDiscoveryListRoute(pathname: string): boolean {
  return Boolean(matchPath('/explore/pools/:chainName?', pathname) || matchPath('/explore/hooks/:chainName?', pathname))
}

export function getPoolAreaNavigation({
  pathname,
  searchParams,
  omitSearchParams = [],
}: {
  pathname: string
  searchParams: URLSearchParams
  omitSearchParams?: readonly string[]
}): Record<PoolAreaTab, string> {
  const retainsAreaQuery = Boolean(matchPath('/positions', pathname)) || isPoolDiscoveryRoute(pathname)
  const params = new URLSearchParams(
    retainsAreaQuery
      ? searchParams
      : Array.from(searchParams).filter(([key]) => SHARED_NAVIGATION_SEARCH_PARAMS.has(key)),
  )
  for (const param of omitSearchParams) {
    params.delete(param)
  }
  return getPoolAreaUrls({ pathname, searchParams: params })
}

export function getPoolAreaUrls({
  pathname,
  searchParams,
}: {
  pathname: string
  searchParams: URLSearchParams
}): Record<PoolAreaTab, string> {
  const isExplorePath = Boolean(matchPath('/explore/*', pathname))
  const { tabOrChain, chainName } = matchPath('/explore/:tabOrChain/:chainName?/*', pathname)?.params ?? {}
  const isHookDetail = Boolean(matchPath('/explore/hooks/:chainName/:hookAddress', pathname))
  const exploreChainName = isHookDetail
    ? undefined
    : Object.values(ExploreTab).some((tab) => tab === tabOrChain)
      ? chainName
      : tabOrChain
  const chainId = getChainIdFromChainUrlParam(
    isExplorePath ? exploreChainName : (searchParams.get('chain') ?? undefined),
  )
  const positionsParams = new URLSearchParams(searchParams)
  const discoveryParams = new URLSearchParams(searchParams)
  discoveryParams.delete('chain')

  if (isExplorePath) {
    positionsParams.delete('chain')
    if (chainId !== undefined) {
      positionsParams.set('chain', getChainUrlParam(chainId))
    }
  }

  const evmChainId = chainId !== undefined && isEVMChain(chainId) ? chainId : undefined

  return {
    positions: withSearchParams('/positions', positionsParams),
    pools: buildExploreUrl({ tabName: ExploreTab.Pools, chainId: evmChainId, searchParams: discoveryParams }),
    hooks: buildExploreUrl({ tabName: ExploreTab.Hooks, chainId: evmChainId, searchParams: discoveryParams }),
  }
}
