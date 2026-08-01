import { Navigate, useLocation } from 'react-router'

/**
 * Landing route for the fiat on-ramp widget's mobile-web return URL
 * (`ON_RAMP_RETURN_PATH`). Forwards to `/buy` with the provider's query string intact
 * via a client-side navigation, which universal/app links cannot intercept.
 */
export function OnRampReturn(): JSX.Element {
  const { search } = useLocation()
  return <Navigate to={{ pathname: '/buy', search }} replace />
}
