import { BaseTransport } from '@amplitude/analytics-core'
import { Payload, Response, Transport } from '@amplitude/analytics-types'
import { logger } from 'utilities/src/logger/logger'
import {
  AnalyticsDebugBridge,
  captureAmplitudeTransportPayload,
} from 'utilities/src/telemetry/analytics/analyticsDebugCapture'

interface TransportConfig {
  serverUrl: string
  appOrigin: string
  originOverride?: string
  appBuild?: string
  reportOriginCountry?: (country: string) => void
  debugBridge?: AnalyticsDebugBridge
}

/**
 * Custom Application Transport used to pass in custom `origin` header,
 * and override `serverUrl` (such as in case of using reverse proxy).
 *
 * Borrowed and modified from: https://github.com/Uniswap/analytics/blob/main/src/analytics/ApplicationTransport.ts
 */
export class ApplicationTransport extends BaseTransport implements Transport {
  private serverUrl: string
  private appOrigin: string
  private originOverride?: string
  private appBuild?: string
  private reportOriginCountry?: (country: string) => void
  private debugBridge?: AnalyticsDebugBridge

  private shouldReportOriginCountry = true

  constructor(config: TransportConfig) {
    super()

    this.serverUrl = config.serverUrl
    this.appOrigin = config.appOrigin

    this.originOverride = config.originOverride
    this.appBuild = config.appBuild
    this.reportOriginCountry = config.reportOriginCountry
    this.debugBridge = config.debugBridge

    /* istanbul ignore if */
    if (typeof fetch === 'undefined') {
      throw new Error('FetchTransport is not supported')
    }
  }

  async send(_serverUrl: string, payload: Payload): Promise<Response | null> {
    const headers: Record<string, string> = {
      'x-origin-application': this.appOrigin,
      'Content-Type': 'application/json',
      Accept: '*/*',
    }

    if (this.originOverride) {
      headers['Origin'] = this.originOverride
    }

    if (this.appBuild) {
      headers['x-application-build'] = this.appBuild
    }

    const request: RequestInit = {
      headers,
      keepalive: true, // allow the request to outlive the page
      body: JSON.stringify(payload),
      method: 'POST',
    }

    if ('events' in payload) {
      captureAmplitudeTransportPayload({ bridge: this.debugBridge, events: payload.events })
    } else {
      logger.debug('ApplicationTransport', 'send', 'Amplitude payload missing events')
    }

    const response = await fetch(this.serverUrl, request)
    const responseJSON: Record<string, unknown> = await response.json()

    // Report origin country back
    if (response.headers.has('Origin-Country') && this.shouldReportOriginCountry) {
      this.reportOriginCountry?.(response.headers.get('Origin-Country') as string)
      this.shouldReportOriginCountry = false
    }

    return this.buildResponse(responseJSON)
  }
}
