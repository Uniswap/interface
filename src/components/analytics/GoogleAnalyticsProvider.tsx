import ReactGA from 'react-ga4'
import { GaOptions, InitOptions, UaEventOptions } from 'react-ga4/types/ga4'

/**
 * Google Analytics Provider containing all methods used throughout app to log events to Google Analytics.
 */
export default class GoogleAnalyticsProvider {
  public static sendEvent(event: string | UaEventOptions, params?: any) {
    ReactGA.event(event, params)
  }

  public static initialize(
    GA_MEASUREMENT_ID: InitOptions[] | string,
    options?: {
      legacyDimensionMetric?: boolean
      nonce?: string
      testMode?: boolean
      gaOptions?: GaOptions | any
      gtagOptions?: any
    }
  ) {
    ReactGA.initialize(GA_MEASUREMENT_ID, options)
  }

  public static set(fieldsObject: any) {
    ReactGA.set(fieldsObject)
  }

  public static outboundLink(
    {
      label,
    }: {
      label: string
    },
    hitCallback: () => unknown
  ) {
    ReactGA.outboundLink({ label }, hitCallback)
  }

  public static pageview(path?: string, _?: string[], title?: string) {
    ReactGA.pageview(path, _, title)
  }

  public static ga(...args: any[]) {
    ReactGA.ga(...args)
  }
}
