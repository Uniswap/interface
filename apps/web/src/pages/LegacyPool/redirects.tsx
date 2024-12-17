import LegacyPool from 'pages/LegacyPool'
import LegacyPositionPage from 'pages/LegacyPool/PositionPage'
import LegacyPoolV2 from 'pages/LegacyPool/v2'
import PoolFinder from 'pages/PoolFinder'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { searchParamToBackendName } from 'utils/chainParams'
import { useAccount } from 'wagmi'

// /pool
export function LegacyPoolRedirects() {
  const isLPRedesignEnabled = useFeatureFlag(FeatureFlags.LPRedesign)

  if (isLPRedesignEnabled) {
    return <Navigate to="/positions" replace />
  }
  return <LegacyPool />
}

// /pool/v2
export function LegacyPoolV2Redirects() {
  const isLPRedesignEnabled = useFeatureFlag(FeatureFlags.LPRedesign)

  if (isLPRedesignEnabled) {
    return <Navigate to="/positions" replace />
  }
  return <LegacyPoolV2 />
}

// /pool/v2/find
export function PoolFinderRedirects() {
  return <PoolFinder />
}

// /pool/:tokenId?chain=...
export function LegacyPositionPageRedirects() {
  const isLPRedesignEnabled = useFeatureFlag(FeatureFlags.LPRedesign)
  const { tokenId } = useParams<{ tokenId: string }>()
  const [searchParams] = useSearchParams()
  const { chainId: connectedChainId } = useAccount()
  const { defaultChainId } = useEnabledChains()

  if (isLPRedesignEnabled) {
    const chainName =
      searchParamToBackendName(searchParams.get('chain'))?.toLowerCase() ??
      toGraphQLChain(connectedChainId ?? defaultChainId).toLowerCase()
    return <Navigate to={`/positions/v3/${chainName}/${tokenId}`} replace />
  }
  return <LegacyPositionPage />
}
