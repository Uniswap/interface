import { useActiveWeb3React } from 'hooks/web3'
import { useEffect } from 'react'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { getCLS, getFCP, getFID, getLCP, Metric } from 'web-vitals'

function reportWebVitals({ name, delta, id }: Metric) {
  ReactGA.timing({
    category: 'Web Vitals',
    variable: name,
    value: Math.round(name === 'CLS' ? delta * 1000 : delta),
    label: id,
  })
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
    ReactGA.set({ cd1: chainId ?? 0 })
  }, [chainId])

  useEffect(() => {
    ReactGA.pageview(`${pathname}${search}`)
  }, [pathname, search])
  return null
}
