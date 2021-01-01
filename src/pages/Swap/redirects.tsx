import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Redirect, RouteComponentProps, useRouteMatch } from 'react-router-dom'
import { AppDispatch } from '../../state'
import { ApplicationModal, setOpenModal } from '../../state/application/actions'

// Redirects to swap but only replace the pathname
export function RedirectPathToSwapOnly({ location }: RouteComponentProps) {
  const [pathName, setPathName] = useState<string>('')
  const router = useRouteMatch().url

  useEffect(() => {
    if (router) {
      setPathName(router)
    }
  }, [router])

  return <Redirect to={{ ...location, pathname: pathName }} />
}

// Redirects from the /swap/:outputCurrency path to the /swap?outputCurrency=:outputCurrency format
export function RedirectToSwap(props: RouteComponentProps<{ outputCurrency: string }>) {
  const {
    location: { search },
    match: {
      params: { outputCurrency }
    }
  } = props

  const [pathName, setPathName] = useState<string>('')
  const router = useRouteMatch().url

  useEffect(() => {
    if (router) {
      setPathName(router)
    }
  }, [router])

  return (
    <Redirect
      to={{
        ...props.location,
        pathname: pathName,
        search:
          search && search.length > 1
            ? `${search}&outputCurrency=${outputCurrency}`
            : `?outputCurrency=${outputCurrency}`
      }}
    />
  )
}

export function OpenClaimAddressModalAndRedirectToSwap(props: RouteComponentProps) {
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    dispatch(setOpenModal(ApplicationModal.ADDRESS_CLAIM))
  }, [dispatch])
  return <RedirectPathToSwapOnly {...props} />
}
