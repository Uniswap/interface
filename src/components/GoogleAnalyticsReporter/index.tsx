import React, { useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import ReactGA from 'react-ga'

export default function GoogleAnalyticsReporter({ location: { pathname, search } }: RouteComponentProps) {
  useEffect(() => {
    const path = pathname.split('/')[1]
    ReactGA.pageview(`/${path}${search}`)
  }, [pathname, search])

  return null
}
