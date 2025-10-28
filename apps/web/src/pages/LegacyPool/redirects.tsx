import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { getCurrencyWithWrap } from 'components/Liquidity/utils/currency'
import { useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useV2Pair } from 'hooks/useV2Pairs'
import { lazy, Suspense } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { Loader } from 'ui/src/loading/Loader'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { searchParamToBackendName } from 'utils/chainParams'

const PoolFinder = lazy(() => import('pages/PoolFinder'))

// /pool
export function LegacyPoolRedirects() {
  return <Navigate to="/positions" replace />
}

// /pool/v2/find
export function PoolFinderRedirects() {
  return (
    <Suspense fallback={<Loader.Box />}>
      <PoolFinder />
    </Suspense>
  )
}

// /remove/v2/:currencyIdA/:currencyIdB
export function RemoveLiquidityV2WithTokenRedirects() {
  const { chainId: connectedChainId } = useAccount()
  const { defaultChainId } = useEnabledChains()

  const { currencyIdA, currencyIdB } = useParams<{
    currencyIdA: string
    currencyIdB: string
  }>()

  const chainId = currencyIdToChain(currencyIdA ?? '') ?? connectedChainId ?? defaultChainId
  const currencyAddressA = currencyIdToAddress(currencyIdA ?? '')
  const currencyAddressB = currencyIdToAddress(currencyIdB ?? '')

  const [currencyA, currencyB] = [
    useCurrency({ address: currencyAddressA, chainId }),
    useCurrency({ address: currencyAddressB, chainId }),
  ]

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
