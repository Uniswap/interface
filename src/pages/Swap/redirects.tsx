import { useEffect } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { useAppDispatch } from 'state/hooks'

import { ApplicationModal, setOpenModal } from '../../state/application/reducer'

// Redirects to swap but only replace the pathname
export function RedirectPathToSwapOnly() {
  const location = useLocation()
  return <Navigate to={{ ...location, pathname: '/swap' }} replace />
}

// Redirects from the /swap/:outputCurrency path to the /swap?outputCurrency=:outputCurrency format
export function RedirectToSwap() {
  const location = useLocation()
  const { search } = location
  const { outputCurrency } = useParams<{ outputCurrency: string }>()

  return (
    <Navigate
      to={{
        ...location,
        pathname: '/swap',
        search:
          search && search.length > 1
            ? `${search}&outputCurrency=${outputCurrency}`
            : `?outputCurrency=${outputCurrency}`,
      }}
      replace
    />
  )
}

export function OpenClaimAddressModalAndRedirectToSwap() {
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(setOpenModal(ApplicationModal.ADDRESS_CLAIM))
  }, [dispatch])
  return <RedirectPathToSwapOnly />
}
