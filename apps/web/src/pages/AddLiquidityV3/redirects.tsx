import { useAccount } from 'hooks/useAccount'
import { Navigate, useParams } from 'react-router-dom'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainUrlParam } from 'utils/chainParams'

export default function AddLiquidityV3WithTokenRedirects() {
  const { currencyIdA, currencyIdB, tokenId } = useParams<{
    currencyIdA: string
    currencyIdB: string
    feeAmount?: string
    tokenId?: string
  }>()
  const { chainId: connectedChainId } = useAccount()
  const { defaultChainId } = useEnabledChains()

  if (tokenId) {
    const chainUrlParam = getChainUrlParam(connectedChainId ?? defaultChainId)
    return <Navigate to={`/positions/v3/${chainUrlParam}/${tokenId}`} replace />
  }

  const url = new URL('/positions/create/v3', window.location.origin)
  if (currencyIdA) {
    url.searchParams.append('currencyA', currencyIdA)
  }
  if (currencyIdB && currencyIdA?.toLowerCase() !== currencyIdB?.toLowerCase()) {
    url.searchParams.append('currencyB', currencyIdB)
  }
  return <Navigate to={url.pathname + url.search} replace />
}
