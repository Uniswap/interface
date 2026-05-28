import { Navigate, useLocation, useParams } from 'react-router-dom'

export default function AddLiquidityV2WithTokenRedirects() {
  const { currencyIdA, currencyIdB } = useParams<{ currencyIdA: string; currencyIdB: string }>()
  const location = useLocation()

  const protocolPath = location.pathname.includes('/add/fewv2') ? 'fewv2' : 'v2'
  const url = new URL(`/positions/create/${protocolPath}`, window.location.origin)
  url.search = location.search
  if (currencyIdA) {
    url.searchParams.set('currencyA', currencyIdA)
  }
  if (currencyIdB && currencyIdA?.toLowerCase() !== currencyIdB?.toLowerCase()) {
    url.searchParams.set('currencyB', currencyIdB)
  }
  return <Navigate to={url.pathname + url.search} replace />
}
