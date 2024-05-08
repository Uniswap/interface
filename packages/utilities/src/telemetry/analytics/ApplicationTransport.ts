import { BaseTransport } from '@amplitude/analytics-core'
import { Payload, Response, Transport } from '@amplitude/analytics-types'

/**
 * Custom Application Transport used to pass in custom `origin` header,
 * and override `serverUrl` (such as in case of using reverse proxy).
 *
 * Borrowed and modified from: https://github.com/Uniswap/analytics/blob/main/src/analytics/ApplicationTransport.ts
 */
export class ApplicationTransport extends BaseTransport implements Transport {
  appOrigin: string
  origin: string | undefined
  appBuild: string | undefined

  constructor(private serverUrl: string, appOrigin: string, origin?: string, appBuild?: string) {
    super()

    this.appOrigin = appOrigin
    this.origin = origin
    this.appBuild = appBuild

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

    if (this.origin) {
      headers.Origin = this.origin
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
    const response = await fetch(this.serverUrl, request)
    const responseJSON: Record<string, unknown> = await response.json()
    return this.buildResponse(responseJSON)
  }
}
