import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { getTokenDetailsURL } from '~/data/util'
import { withoutChainSearchParam } from '~/utils/params/chainQueryParam'

export function getTokenDetailsURLForMultichainEntry({
  entry,
  searchParams,
}: {
  entry: MultichainTokenEntry
  searchParams: URLSearchParams
}): string {
  const path = getTokenDetailsURL({
    address: entry.isNative ? null : entry.address,
    chainId: entry.chainId,
  })
  const params = withoutChainSearchParam(searchParams)
  const query = params.toString()
  return `${path}${query ? `?${query}` : ''}`
}

/**
 * TDP pathname + search params. Prefers `window.location` on TDP routes because the network selector
 * rewrites the URL with `history.replaceState`, which react-router does not observe.
 */
export function getCurrentTDPUrlState({
  routerPathname,
  routerSearchParams,
}: {
  routerPathname: string
  routerSearchParams: URLSearchParams
}): { pathname: string; searchParams: URLSearchParams } {
  if (window.location.pathname.startsWith('/explore/tokens/')) {
    return {
      pathname: window.location.pathname,
      searchParams: new URLSearchParams(window.location.search),
    }
  }
  return { pathname: routerPathname, searchParams: routerSearchParams }
}
