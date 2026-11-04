import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { useAccount } from '~/connection/hooks/useAccount'
import { getCurrencyWithWrap } from '~/features/Liquidity/utils/currency'
import { useCurrency } from '~/hooks/currency/useCurrency'
import { useV2Pair } from '~/pages/LegacyPool/useV2Pairs'
import { getChainUrlParam, searchParamToBackendName } from '~/utils/params/chainParams'

// /pool
export function LegacyPoolRedirects() {
  return <Navigate to="/positions" replace />
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
    return <Navigate to={`/positions/v2/${getChainUrlParam(chainId)}/${pair.liquidityToken.address}`} replace />
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
    searchParamToBackendName(searchParams.get('chain')) ?? getChainUrlParam(connectedChainId ?? defaultChainId)
  return <Navigate to={`/positions/v3/${chainName}/${tokenId}`} replace />
}
