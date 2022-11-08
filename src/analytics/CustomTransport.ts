import { BaseTransport } from '@amplitude/analytics-core'
import { Payload, Response, Transport } from '@amplitude/analytics-types'

export class CustomTransport extends BaseTransport implements Transport {
  async send(serverUrl: string, payload: Payload): Promise<Response | null> {
    /* istanbul ignore if */
    if (typeof fetch === 'undefined') {
      throw new Error('FetchTransport is not supported')
    }
    const options: RequestInit = {
      headers: {
        'x-origin-application': 'interface',
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
      body: JSON.stringify(payload),
      method: 'POST',
    }
    const response = await fetch(serverUrl, options)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const responsePayload: Record<string, any> = await response.json()
    return this.buildResponse(responsePayload)
  }
}
