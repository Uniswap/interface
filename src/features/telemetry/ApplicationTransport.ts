import { BaseTransport } from '@amplitude/analytics-core'
import { Payload, Response, Transport } from '@amplitude/analytics-types'
import DeviceInfo from 'react-native-device-info'
import { uniswapUrls } from 'src/constants/urls'

const MOBILE_ORIGIN_APPLICATION = 'mobile-analytics-uniswap'

/**
 * Custom Application Transport used to pass in custom `origin` header,
 * and override `serverUrl` (such as in case of using reverse proxy).
 *
 * Borrowed from: https://github.com/Uniswap/analytics/blob/main/src/analytics/ApplicationTransport.ts
 */
export class ApplicationTransport extends BaseTransport implements Transport {
  constructor(private serverUrl: string) {
    super()

    /* istanbul ignore if */
    if (typeof fetch === 'undefined') {
      throw new Error('FetchTransport is not supported')
    }
  }

  async send(_serverUrl: string, payload: Payload): Promise<Response | null> {
    const request: RequestInit = {
      headers: {
        'x-origin-application': MOBILE_ORIGIN_APPLICATION,
        'Content-Type': 'application/json',
        Accept: '*/*',
        Origin: uniswapUrls.apiBaseUrl,
        'x-application-build': DeviceInfo.getBundleId(),
      },
      keepalive: true, // allow the request to outlive the page
      body: JSON.stringify(payload),
      method: 'POST',
    }
    const response = await fetch(this.serverUrl, request)
    const responseJSON: Record<string, unknown> = await response.json()
    return this.buildResponse(responseJSON)
  }
}
