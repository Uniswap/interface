import React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import Bridge from '.'

export function RedirectPathToBridge(props: RouteComponentProps<{ inputCurrency: string }>) {
  return <Bridge {...props} />
}
