import {
  DEFAULT_HEADERS,
  GOOGLE_CONVERSION_EVENTS,
  GOOGLE_CONVERSION_URL,
} from 'uniswap/src/data/rest/conversionTracking/constants'
import { buildProxyRequest } from 'uniswap/src/data/rest/conversionTracking/tracking'
import { RequestType } from 'uniswap/src/data/rest/conversionTracking/types'
import { hashAddress } from 'uniswap/src/data/rest/conversionTracking/utils'

describe(buildProxyRequest, () => {
  it('properly formats event data to make a conversion proxy request', () => {
    const testEvent = GOOGLE_CONVERSION_EVENTS.Web.WalletConnected
    const requestArgs = {
      lead: {
        id: 'test',
        type: testEvent.platformIdType,
        timestamp: new Date().valueOf(),
        executedEvents: [],
      },
      address: '0x123',
      eventId: testEvent.eventId,
      eventName: testEvent.eventName,
    }

    const request = buildProxyRequest(requestArgs)

    expect(request.requestType).toEqual(testEvent.eventName)
    expect(request.identifier).toEqual(hashAddress(requestArgs.address))
    expect(request.to).toEqual(GOOGLE_CONVERSION_URL)
    expect(request.method).toEqual(RequestType.POST)
    expect(request.headers).toContain(DEFAULT_HEADERS[0])
    expect(request.body).toBeDefined()
  })
})
