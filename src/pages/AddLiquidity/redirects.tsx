import React, { useEffect, useState } from 'react'
import { Redirect, RouteComponentProps, useRouteMatch } from 'react-router-dom'
import AddLiquidity from './index'

export function RedirectToAddLiquidity() {
  const [pathName, setPathName] = useState<string>('')
  const router = useRouteMatch().url;

  useEffect(() => {
    if (router) {
      setPathName(router)
    }
  }, [router])

  return <Redirect to={pathName} />
}

const OLD_PATH_STRUCTURE = /^(0x[a-fA-F0-9]{40})-(0x[a-fA-F0-9]{40})$/
export function RedirectOldAddLiquidityPathStructure(props: RouteComponentProps<{ currencyIdA: string }>) {
  const {
    match: {
      params: { currencyIdA }
    }
  } = props

  const [pathName, setPathName] = useState<string>('')
  const router = useRouteMatch().url;

  useEffect(() => {
    if (router) {
      setPathName(router)
    }
  }, [router])

  const match = currencyIdA.match(OLD_PATH_STRUCTURE)
  if (match?.length) {
    return <Redirect to={`/${pathName}/add/${match[1]}/${match[2]}`} />
  }

  return <AddLiquidity {...props} />
}

export function RedirectDuplicateTokenIds(props: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const {
    match: {
      params: { currencyIdA, currencyIdB }
    }
  } = props

  const [pathName, setPathName] = useState<string>('')
  const router = useRouteMatch().url;

  useEffect(() => {
    if (router) {
      setPathName(router)
    }
  }, [router])


  if (currencyIdA.toLowerCase() === currencyIdB.toLowerCase()) {
    return <Redirect to={`/${pathName}/add/${currencyIdA}`} />
  }
  return <AddLiquidity {...props} />
}
