import AddLiquidityV2 from 'pages/AddLiquidityV2/index'
import { Navigate, useParams } from 'react-router-dom'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export default function AddLiquidityV2WithTokenRedirects() {
  const isLPRedesignEnabled = useFeatureFlag(FeatureFlags.LPRedesign)
  const { currencyIdA, currencyIdB } = useParams<{ currencyIdA: string; currencyIdB: string }>()

  if (isLPRedesignEnabled) {
    const url = new URL('/positions/create/v2', window.location.origin)
    if (currencyIdA) {
      url.searchParams.append('currencyA', currencyIdA)
    }
    if (currencyIdB && currencyIdA?.toLowerCase() !== currencyIdB?.toLowerCase()) {
      url.searchParams.append('currencyB', currencyIdB)
    }
    return <Navigate to={url.pathname + url.search} replace />
  }
  if (currencyIdA && currencyIdB && currencyIdA.toLowerCase() === currencyIdB.toLowerCase()) {
    return <Navigate to={`/add/v2/${currencyIdA}`} replace />
  }

  return <AddLiquidityV2 />
}
