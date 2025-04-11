import { Navigate, useParams } from 'react-router-dom'

export default function AddLiquidityV2WithTokenRedirects() {
  const { currencyIdA, currencyIdB } = useParams<{ currencyIdA: string; currencyIdB: string }>()

  const url = new URL('/positions/create/v2', window.location.origin)
  if (currencyIdA) {
    url.searchParams.append('currencyA', currencyIdA)
  }
  if (currencyIdB && currencyIdA?.toLowerCase() !== currencyIdB?.toLowerCase()) {
    url.searchParams.append('currencyB', currencyIdB)
  }
  return <Navigate to={url.pathname + url.search} replace />
}
