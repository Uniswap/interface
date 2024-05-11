import { BaseTransport } from '@amplitude/analytics-core'
import { Payload, Response, Transport } from '@amplitude/analytics-types'

export enum OriginApplication {
  DOCS = 'docs',
  INFO = 'info',
  INTERFACE = 'interface',
  MOBILE = 'mobile-analytics-ubeswap',
  ORG = 'org',
}

/**
 * A custom Transport layer that sets `x-origin-application` to route the application to its Amplitude project
 *
 * @param originApplication Name of the application consuming the package. Used to route events to its project.
 *
 * See example here: https://github.com/amplitude/Amplitude-TypeScript/blob/main/packages/analytics-client-common/src/transports/fetch.ts
 */
export class ApplicationTransport extends BaseTransport implements Transport {
  private shouldReportOriginCountry = true

  constructor(
    private originApplication: OriginApplication,
    private reportOriginCountry?: (country: string) => void
  ) {
    super()

    /* istanbul ignore if */
    if (typeof fetch === 'undefined') {
      throw new Error('FetchTransport is not supported')
    }
  }

  async send(serverUrl: string, payload: Payload): Promise<Response | null> {
    const request: RequestInit = {
      headers: {
        'x-origin-application': this.originApplication,
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
      keepalive: true, // allow the request to outlive the page
      body: JSON.stringify(payload),
      method: 'POST',
    }
    const response = await fetch(serverUrl, request)
    const responseJSON: Record<string, unknown> = await response.json()

    if (response.headers.has('Origin-Country') && this.shouldReportOriginCountry) {
      this.reportOriginCountry?.(response.headers.get('Origin-Country') as string)
      this.shouldReportOriginCountry = false
    }

    return this.buildResponse(responseJSON)
  }
}
