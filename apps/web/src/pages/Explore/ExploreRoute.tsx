import { Loader } from '@universe/mycelium'
import { lazy, type ReactNode, Suspense, useState } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router'
import { useExploreParams } from '~/features/Explore/hooks/useExploreParams'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { AUCTION_FILTER_PARAM, auctionQuickFilterFromParam } from '~/pages/Explore/hooks/useAuctionQuickFilterParam'
import { ExploreTab } from '~/types/explore'

const Explore = lazy(() => import('~/pages/Explore'))

export function ExploreRoute({ children }: { children?: ReactNode }): JSX.Element {
  const { tab, chainName, tokenAddress } = useExploreParams()
  const isLegacyUrl = !useLocation().pathname.includes('explore')
  const [params] = useSearchParams()
  // Seed auction deep links before the filter store's first render.
  const [initialQuickFilter] = useState(() =>
    tab === ExploreTab.Toucan ? auctionQuickFilterFromParam(params.get(AUCTION_FILTER_PARAM)) : undefined,
  )

  if (isLegacyUrl) {
    if (tab && chainName && tokenAddress) {
      return <Navigate to={`/explore/${tab}/${chainName}/${tokenAddress}`} replace />
    } else if (chainName && tokenAddress) {
      return <Navigate to={`/explore/tokens/${chainName}/${tokenAddress}`} replace />
    } else if (tab && chainName) {
      return <Navigate to={`/explore/${tab}/${chainName}`} replace />
    }
  }

  // Every discovery route shares this outer owner so React retains the filter store between tabs.
  return (
    <ExploreTablesFilterStoreContextProvider initialQuickFilter={initialQuickFilter}>
      <Suspense fallback={<Loader.Box />}>{children ?? <Explore initialTab={tab} />}</Suspense>
    </ExploreTablesFilterStoreContextProvider>
  )
}

export default ExploreRoute
