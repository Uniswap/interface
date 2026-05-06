import { lazy, Suspense } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Loader } from 'ui/src/loading/Loader'
import { useExploreParams } from '~/features/Explore/hooks/useExploreParams'

const Explore = lazy(() => import('~/pages/Explore'))

export { useExploreParams } from '~/features/Explore/hooks/useExploreParams'

export default function RedirectExplore() {
  const { tab, chainName, tokenAddress } = useExploreParams()
  const isLegacyUrl = !useLocation().pathname.includes('explore')

  if (isLegacyUrl) {
    if (tab && chainName && tokenAddress) {
      return <Navigate to={`/explore/${tab}/${chainName}/${tokenAddress}`} replace />
    } else if (chainName && tokenAddress) {
      return <Navigate to={`/explore/tokens/${chainName}/${tokenAddress}`} replace />
    } else if (tab && chainName) {
      return <Navigate to={`/explore/${tab}/${chainName}`} replace />
    }
  }

  return (
    <Suspense fallback={<Loader.Box />}>
      <Explore initialTab={tab} />
    </Suspense>
  )
}
