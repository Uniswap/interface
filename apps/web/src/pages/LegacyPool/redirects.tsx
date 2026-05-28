// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { useCurrency } from 'hooks/Tokens'
import { useV2Pair } from 'hooks/useV2Pairs'
import { getCurrencyWithWrap } from 'pages/Pool/Positions/create/utils'
import { Suspense, lazy } from 'react'
import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { parseCurrencyFromURLParameter } from 'state/swap/hooks'
import { Loader } from 'ui/src/loading/Loader'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getChainIdFromChainUrlParam, searchParamToBackendName } from 'utils/chainParams'
import { useAccount } from 'wagmi'

const PoolFinder = lazy(() => import('pages/PoolFinder'))
const FewV2PoolFinder = lazy(() => import('pages/PoolFinder/FewV2PoolFinder'))

/**
 * Controls /positions import copy and V2 vs FewV2 flows.
 *
 * 1. NETWORKS_V2_ONLY: V2 only (no FewV2). Shown as "V2 only: ..." on /positions.
 * 2. NETWORKS_FEWV2: All chains that support FewV2 (used for "Few V2: ..." on /positions).
 *    See SUPPORTED_V2POOL_CHAIN_IDS in useNetworkSupportsV2 minus NETWORKS_V2_ONLY.
 * 3. NETWORKS_V2_AND_FEWV2: Chains that support BOTH V2 and Few V2 (e.g. Ethereum, Hyper, BNB).
 *    Shown as "X support both" on /positions.
 */
/** Chains that have swap but no V2/FewV2 positions support. Excluded from /positions create, find, and import copy. */
export const NETWORKS_POSITIONS_UNSUPPORTED: UniverseChainId[] = [
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Unichain,
  UniverseChainId.Base,
]

/** V2 only (no FewToken/FewV2). Used for /positions "V2 only" list and V2 find page. megaETH excluded (no V2 support yet). */
export const NETWORKS_V2_ONLY: UniverseChainId[] = [UniverseChainId.XLayer]

/** @deprecated Use NETWORKS_V2_ONLY. Kept for backward compatibility. */
export const NETWORKS_WITHOUT_FEWTOKEN: UniverseChainId[] = NETWORKS_V2_ONLY

/** Chains where FEW wrapping is fully supported. Used by /ringwrap token selector. */
export const FEW_SUPPORTED_CHAIN_IDS: UniverseChainId[] = [
  UniverseChainId.Mainnet,
  UniverseChainId.HyperMainnet,
  UniverseChainId.MEGAETHMainnet,
  UniverseChainId.Bnb,
]

/** Chains that support both V2 and Few V2. Used for /positions "support both" sentence. */
export const NETWORKS_V2_AND_FEWV2: UniverseChainId[] = [
  UniverseChainId.Mainnet,
  UniverseChainId.HyperMainnet,
  UniverseChainId.MEGAETHMainnet,
  UniverseChainId.Bnb,
]

// /pool
export function LegacyPoolRedirects() {
  return <Navigate to="/positions" replace />
}

// /pools/v2/find -> V2 PoolFinder only; /pools/fewV2/find -> FewV2 PoolFinder only (no chain-based fallback)
export function PoolFinderRedirects() {
  const location = useLocation()
  const isFewv2 = location.pathname.includes('/fewV2/find')

  return <Suspense fallback={<Loader.Box />}>{isFewv2 ? <FewV2PoolFinder /> : <PoolFinder />}</Suspense>
}

// /remove/v2/:currencyIdA/:currencyIdB
export function RemoveLiquidityV2WithTokenRedirects() {
  const { chainId: connectedChainId } = useAccount()
  const { defaultChainId } = useEnabledChains()

  const { currencyIdA, currencyIdB } = useParams<{
    currencyIdA: string
    currencyIdB: string
  }>()
  const [searchParams] = useSearchParams()
  const chainParam = searchParams.get('chain') ?? undefined

  const currencyAddressA = parseCurrencyFromURLParameter(currencyIdA ?? '')
  const currencyAddressB = parseCurrencyFromURLParameter(currencyIdB ?? '')

  const chainId = getChainIdFromChainUrlParam(chainParam) ?? connectedChainId ?? defaultChainId

  const [currencyA, currencyB] = [useCurrency(currencyAddressA, chainId), useCurrency(currencyAddressB, chainId)]

  const [, pair] = useV2Pair(
    getCurrencyWithWrap(currencyA, ProtocolVersion.V2),
    getCurrencyWithWrap(currencyB, ProtocolVersion.V2),
  )

  if (pair) {
    return (
      <Navigate to={`/positions/v2/${toGraphQLChain(chainId).toLowerCase()}/${pair.liquidityToken.address}`} replace />
    )
  }

  return <Navigate to="/positions" replace />
}

// /pool/:tokenId?chain=...
export function LegacyPositionPageRedirects() {
  const { tokenId } = useParams<{ tokenId: string }>()
  const [searchParams] = useSearchParams()
  const { chainId: connectedChainId } = useAccount()
  const { defaultChainId } = useEnabledChains()

  const chainName =
    searchParamToBackendName(searchParams.get('chain'))?.toLowerCase() ??
    toGraphQLChain(connectedChainId ?? defaultChainId).toLowerCase()
  return <Navigate to={`/positions/v3/${chainName}/${tokenId}`} replace />
}
