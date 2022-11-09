import { Navigate, useLocation, useParams } from 'react-router-dom'

// Redirects from the /swap/:outputCurrency path to the /swap?outputCurrency=:outputCurrency format
export function RedirectToExplore() {
  const location = useLocation()
  const { chainName } = useParams<{ chainName?: string }>()

  return (
    <Navigate
      to={{
        ...location,
        pathname: chainName ? `/tokens/${chainName}` : '/tokens',
      }}
      replace
    />
  )
}
