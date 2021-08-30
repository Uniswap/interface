import { useEffect } from 'react'
import ReactGA from 'react-ga4'
import { RouteComponentProps } from 'react-router-dom'

// fires a GA pageview every time the route changes
export default function GoogleAnalyticsReporter({ location: { pathname, search } }: RouteComponentProps): null {
  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page:`${pathname}${search}` })
  }, [pathname, search])
  return null
}
