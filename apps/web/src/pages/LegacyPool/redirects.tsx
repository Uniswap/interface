// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { useCurrency } from 'hooks/Tokens'
import { useV2Pair } from 'hooks/useV2Pairs'
import { getCurrencyWithWrap } from 'pages/Pool/Positions/create/utils'
import PoolFinder from 'pages/PoolFinder'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { parseCurrencyFromURLParameter } from 'state/swap/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getChainIdFromChainUrlParam, searchParamToBackendName } from 'utils/chainParams'
import { useAccount } from 'wagmi'

// /pool
export function LegacyPoolRedirects() {
  return <Navigate to="/positions" replace />
}

// /pool/v2/find
export function PoolFinderRedirects() {
  return <PoolFinder />
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
