import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useEffect } from 'react'
import { UaEventOptions } from 'react-ga4/types/ga4'
import { RouteComponentProps } from 'react-router-dom'
import { isMobile } from 'utils/userAgent'
import { getCLS, getFCP, getFID, getLCP, Metric } from 'web-vitals'

import GoogleAnalyticsProvider from './GoogleAnalyticsProvider'

export const GOOGLE_ANALYTICS_CLIENT_ID_STORAGE_KEY = 'ga_client_id'
const GOOGLE_ANALYTICS_ID: string | undefined = process.env.REACT_APP_GOOGLE_ANALYTICS_ID

const storedClientId = window.localStorage.getItem(GOOGLE_ANALYTICS_CLIENT_ID_STORAGE_KEY)

const googleAnalytics = new GoogleAnalyticsProvider()

const sendEvent = (event: string | UaEventOptions, params?: any) => googleAnalytics.sendEvent(event, params)

const outboundLink = (
  {
    label,
  }: {
    label: string
  },
  hitCallback: () => unknown
) => googleAnalytics.outboundLink({ label }, hitCallback)

const gaCommandSendTiming = (timingCategory: any, timingVar: any, timingValue: any, timingLabel: any) =>
  googleAnalytics.gaCommandSendTiming(timingCategory, timingVar, timingValue, timingLabel)

if (typeof GOOGLE_ANALYTICS_ID === 'string') {
  googleAnalytics.initialize(GOOGLE_ANALYTICS_ID, {
    gaOptions: {
      storage: 'none',
      storeGac: false,
      clientId: storedClientId ?? undefined,
    },
  })
  googleAnalytics.set({
    anonymizeIp: true,
    customBrowserType: !isMobile
      ? 'desktop'
      : 'web3' in window || 'ethereum' in window
      ? 'mobileWeb3'
      : 'mobileRegular',
  })
} else {
  googleAnalytics.initialize('test', { gtagOptions: { debug_mode: true } })
}

function reportWebVitals({ name, delta, id }: Metric) {
  gaCommandSendTiming('Web Vitals', name, Math.round(name === 'CLS' ? delta * 1000 : delta), id)
}

// tracks web vitals and pageviews
export function GoogleAnalyticsReporter({ location: { pathname, search } }: RouteComponentProps): null {
  useEffect(() => {
    getFCP(reportWebVitals)
    getFID(reportWebVitals)
    getLCP(reportWebVitals)
    getCLS(reportWebVitals)
  }, [])

  const { chainId } = useActiveWeb3React()
  useEffect(() => {
    // cd1 - custom dimension 1 - chainId
    googleAnalytics.set({ cd1: chainId ?? 0 })
  }, [chainId])

  useEffect(() => {
    googleAnalytics.pageview(`${pathname}${search}`)
  }, [pathname, search])

  useEffect(() => {
    // typed as 'any' in react-ga4 -.-
    googleAnalytics.ga((tracker: any) => {
      if (!tracker) return

      const clientId = tracker.get('clientId')
      window.localStorage.setItem(GOOGLE_ANALYTICS_CLIENT_ID_STORAGE_KEY, clientId)
    })
  }, [])
  return null
}

export { sendEvent }
export { outboundLink }
export { gaCommandSendTiming }
