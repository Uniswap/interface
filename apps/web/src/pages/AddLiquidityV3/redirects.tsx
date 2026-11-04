import { Navigate, useParams } from 'react-router'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'
import { useAccount } from '~/connection/hooks/useAccount'
import { CREATE_POOL_PATH } from '~/pages/AddLiquidity/poolLinkParams'
import { getChainUrlParam } from '~/utils/params/chainParams'

export function AddLiquidityV3WithTokenRedirects() {
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

  const url = new URL(CREATE_POOL_PATH, window.location.origin)
  url.searchParams.append('protocolVersion', 'v3')
  if (currencyIdA) {
    url.searchParams.append('currencyA', currencyIdA)
  }
  if (currencyIdB && (!currencyIdA || !areCurrencyIdsEqual(currencyIdA, currencyIdB))) {
    url.searchParams.append('currencyB', currencyIdB)
  }
  return <Navigate to={url.pathname + url.search} replace />
}

export default AddLiquidityV3WithTokenRedirects
