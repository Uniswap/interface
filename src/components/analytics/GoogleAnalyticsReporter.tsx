import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { getCLS, getFCP, getFID, getLCP, Metric } from 'web-vitals'

import GoogleAnalyticsProvider from './GoogleAnalyticsProvider'
import { GOOGLE_ANALYTICS_CLIENT_ID_STORAGE_KEY } from './index'

function reportWebVitals({ name, delta, id }: Metric) {
  GoogleAnalyticsProvider.gaCommandSendTiming('Web Vitals', name, Math.round(name === 'CLS' ? delta * 1000 : delta), id)
}

// tracks web vitals and pageviews
export default function GoogleAnalyticsReporter({ location: { pathname, search } }: RouteComponentProps): null {
  useEffect(() => {
    getFCP(reportWebVitals)
    getFID(reportWebVitals)
    getLCP(reportWebVitals)
    getCLS(reportWebVitals)
  }, [])

  const { chainId } = useActiveWeb3React()
  useEffect(() => {
    // cd1 - custom dimension 1 - chainId
    GoogleAnalyticsProvider.set({ cd1: chainId ?? 0 })
  }, [chainId])

  useEffect(() => {
    GoogleAnalyticsProvider.pageview(`${pathname}${search}`)
  }, [pathname, search])

  useEffect(() => {
    // typed as 'any' in react-ga4 -.-
    GoogleAnalyticsProvider.ga((tracker: any) => {
      if (!tracker) return

      const clientId = tracker.get('clientId')
      window.localStorage.setItem(GOOGLE_ANALYTICS_CLIENT_ID_STORAGE_KEY, clientId)
    })
  }, [])
  return null
}
