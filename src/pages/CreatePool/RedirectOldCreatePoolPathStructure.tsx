import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import CreatePool from './index'

const OLD_PATH_STRUCTURE = /^(0x[a-fA-F0-9]{40})-(0x[a-fA-F0-9]{40})$/
export default function RedirectOldCreatePoolPathStructure(props: RouteComponentProps<{ currencyIdA: string }>) {
  const {
    match: {
      params: { currencyIdA }
    }
  } = props
  const match = currencyIdA.match(OLD_PATH_STRUCTURE)
  if (match?.length) {
    return <Redirect to={`/create/${match[1]}/${match[2]}`} />
  }

  return <CreatePool {...props} />
}
