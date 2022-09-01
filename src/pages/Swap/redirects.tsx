import { ApplicationModal, setOpenModal } from '../../state/application/actions'

import { Redirect as Redirector } from 'react-router'
import { useAppDispatch } from 'state/hooks'
import { useEffect } from 'react'

export function Redirect(props: any) {
  return <Redirector {...props} />
}

// Redirects to swap but only replace the pathname
export function RedirectPathToSwapOnly({ location }: any) {
  return <Redirect to={{ ...location, pathname: '/swap' }} />
}

// Redirects from the /swap/:outputCurrency path to the /swap?outputCurrency=:outputCurrency format
export function RedirectToSwap(props: any) {
  const {
    location: { search },
    match: {
      params: { outputCurrency },
    },
  } = props

  return (
    <Redirect
      to={{
        ...props.location,
        pathname: '/swap',
        search:
          search && search.length > 1
            ? `${search}&outputCurrency=${outputCurrency}`
            : `?outputCurrency=${outputCurrency}`,
      }}
    />
  )
}

export function OpenClaimAddressModalAndRedirectToSwap(props: any) {
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(setOpenModal(ApplicationModal.ADDRESS_CLAIM))
  }, [dispatch])
  return <RedirectPathToSwapOnly {...props} />
}
