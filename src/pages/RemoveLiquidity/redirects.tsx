import React, { useEffect, useState } from 'react'
import { RouteComponentProps, Redirect, useRouteMatch } from 'react-router-dom'

const OLD_PATH_STRUCTURE = /^(0x[a-fA-F0-9]{40})-(0x[a-fA-F0-9]{40})$/

export function RedirectOldRemoveLiquidityPathStructure({
  match: {
    params: { tokens }
  }
}: RouteComponentProps<{ tokens: string }>) {
  const [pathName, setPathName] = useState<string>('')
  const router = useRouteMatch().url;

  useEffect(() => {
    if (router) {
      setPathName(router)
    }
  }, [router])

  if (!OLD_PATH_STRUCTURE.test(tokens)) {
    return <Redirect to={`/${pathName}/pool`} />
  }
  const [currency0, currency1] = tokens.split('-')

  return <Redirect to={`/${pathName}/remove/${currency0}/${currency1}`} />
}
