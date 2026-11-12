import { Navigate, useParams } from 'react-router'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'
import { CREATE_POOL_PATH } from '~/utils/params/poolLinkParams'

export function AddLiquidityV2WithTokenRedirects() {
  const { currencyIdA, currencyIdB } = useParams<{ currencyIdA: string; currencyIdB: string }>()

  const url = new URL(CREATE_POOL_PATH, window.location.origin)
  url.searchParams.append('protocolVersion', 'v2')
  if (currencyIdA) {
    url.searchParams.append('currencyA', currencyIdA)
  }
  if (currencyIdB && (!currencyIdA || !areCurrencyIdsEqual(currencyIdA, currencyIdB))) {
    url.searchParams.append('currencyB', currencyIdB)
  }
  return <Navigate to={url.pathname + url.search} replace />
}

export default AddLiquidityV2WithTokenRedirects
