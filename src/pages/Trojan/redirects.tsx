import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'

// Redirects to swap but only replace the pathname
export function RedirectPathToTrojanOnly({ location }: RouteComponentProps) {
  return <Redirect to={{ ...location, pathname: '/trojan' }} />
}
