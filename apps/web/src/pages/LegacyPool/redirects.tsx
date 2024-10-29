import { chainIdToBackendChain } from 'constants/chains'
import LegacyPool from 'pages/LegacyPool'
import LegacyPositionPage from 'pages/LegacyPool/PositionPage'
import LegacyPoolV2 from 'pages/LegacyPool/v2'
import PoolFinder from 'pages/PoolFinder'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { searchParamToBackendName } from 'utils/chains'
import { useAccount } from 'wagmi'

// /pool
export function LegacyPoolRedirects() {
  const isV4EverywhereEnabled = useFeatureFlag(FeatureFlags.V4Everywhere)

  if (isV4EverywhereEnabled) {
    return <Navigate to="/positions" replace />
  }
  return <LegacyPool />
}

// /pool/v2
export function LegacyPoolV2Redirects() {
  const isV4EverywhereEnabled = useFeatureFlag(FeatureFlags.V4Everywhere)

  if (isV4EverywhereEnabled) {
    return <Navigate to="/positions" replace />
  }
  return <LegacyPoolV2 />
}

// /pool/v2/find
export function PoolFinderRedirects() {
  const isV4EverywhereEnabled = useFeatureFlag(FeatureFlags.V4Everywhere)

  if (isV4EverywhereEnabled) {
    return <Navigate to="/positions" replace />
  }
  return <PoolFinder />
}

// /pool/:tokenId?chain=...
export function LegacyPositionPageRedirects() {
  const isV4EverywhereEnabled = useFeatureFlag(FeatureFlags.V4Everywhere)
  const { tokenId } = useParams<{ tokenId: string }>()
  const [searchParams] = useSearchParams()
  const { chainId: connectedChainId } = useAccount()

  if (isV4EverywhereEnabled) {
    const chainName =
      searchParamToBackendName(searchParams.get('chain'))?.toLowerCase() ??
      chainIdToBackendChain({ chainId: connectedChainId ?? UniverseChainId.Mainnet }).toLowerCase()
    return <Navigate to={`/positions/v3/${chainName}/${tokenId}`} replace />
  }
  return <LegacyPositionPage />
}
