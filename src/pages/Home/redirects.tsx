import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'

// Redirects to home but only replace the pathname
export function RedirectPathToHomeOnly({ location }: RouteComponentProps) {
  return <Redirect to={{ ...location, pathname: '/home' }} />
}
