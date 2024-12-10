import AddLiquidityV2 from 'pages/AddLiquidityV2/index'
import { Navigate, useParams } from 'react-router-dom'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export default function AddLiquidityV2WithTokenRedirects() {
  const isLPRedesignEnabled = useFeatureFlag(FeatureFlags.LPRedesign)
  const { currencyIdA, currencyIdB } = useParams<{ currencyIdA: string; currencyIdB: string }>()
  if (isLPRedesignEnabled) {
    // TODO(WEB-5361): update this to enable prefilling form from URL currencyIdA and currencyIdB
    return <Navigate to="/positions/create/v2" replace />
  }
  if (currencyIdA && currencyIdB && currencyIdA.toLowerCase() === currencyIdB.toLowerCase()) {
    return <Navigate to={`/add/v2/${currencyIdA}`} replace />
  }

  return <AddLiquidityV2 />
}
