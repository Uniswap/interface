import type { PartialMessage } from '@bufbuild/protobuf'
import { type ConversionTrackingApi } from '@universe/api'
import { format } from 'date-fns'
import ms from 'ms'
import {
  DEFAULT_HEADERS,
  GOOGLE_CONVERSION_DATETIME_FORMAT,
  GOOGLE_CONVERSION_URL,
  REDDIT_CONVERSION_URL,
  TWITTER_CONVERSION_URL,
} from 'uniswap/src/data/rest/conversionTracking/constants'
import { type BuildProxyRequestArgs, PlatformIdType, RequestType } from 'uniswap/src/data/rest/conversionTracking/types'
import { addJitter, hashAddress } from 'uniswap/src/data/rest/conversionTracking/utils'

const buildTwitterProxyRequest = ({
  lead,
  address,
  eventId,
  eventName,
}: BuildProxyRequestArgs): PartialMessage<ConversionTrackingApi.ProxyRequest> => ({
  requestType: eventName,
  identifier: hashAddress(address),
  to: TWITTER_CONVERSION_URL,
  method: RequestType.POST,
  headers: DEFAULT_HEADERS,
  body: JSON.stringify({
    conversions: [
      {
        conversion_time: addJitter(new Date()),
        event_id: eventId,
        identifiers: [{ [PlatformIdType.Twitter]: lead.id }],
      },
    ],
  }),
})

const buildRedditProxyRequest = ({
  lead,
  address,
  eventId,
  eventName,
}: BuildProxyRequestArgs): PartialMessage<ConversionTrackingApi.ProxyRequest> => ({
  requestType: eventName,
  identifier: hashAddress(address),
  to: REDDIT_CONVERSION_URL,
  method: RequestType.POST,
  headers: DEFAULT_HEADERS,
  body: JSON.stringify({
    events: [
      {
        click_id: lead.id,
        // Note: Reddit refuses requests that are more than 5m in the future
        event_at: new Date(new Date().valueOf() + ms('4m')),
        event_metadata: { currency: 'USD', value_decimal: 1 },
        event_type: {
          tracking_type: eventId,
        },
      },
    ],
  }),
})

const buildGoogleProxyRequest = ({
  lead,
  address,
  eventId,
  eventName,
}: BuildProxyRequestArgs): PartialMessage<ConversionTrackingApi.ProxyRequest> => ({
  requestType: eventName,
  identifier: hashAddress(address),
  to: GOOGLE_CONVERSION_URL,
  method: RequestType.POST,
  headers: DEFAULT_HEADERS,
  body: JSON.stringify({
    partial_failure: true,
    conversions: [
      {
        gclid: lead.id,
        conversionDateTime: format(new Date(), GOOGLE_CONVERSION_DATETIME_FORMAT),
        conversionAction: eventId,
      },
    ],
  }),
})

export const buildProxyRequest = (args: BuildProxyRequestArgs): PartialMessage<ConversionTrackingApi.ProxyRequest> => {
  const { lead } = args

  switch (lead.type) {
    case PlatformIdType.Twitter:
      return buildTwitterProxyRequest(args)
    case PlatformIdType.Reddit:
      return buildRedditProxyRequest(args)
    case PlatformIdType.Google:
      return buildGoogleProxyRequest(args)
    default:
      throw new Error('Platform not supported.')
  }
}
