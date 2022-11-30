import ms from 'ms.macro'
import {
  RelayNetworkLayer,
  RelayNetworkLayerResponse,
  RelayRequestAny,
  retryMiddleware,
  urlMiddleware,
} from 'react-relay-network-modern'
import { Environment, RecordSource, Store } from 'relay-runtime'

// This makes it possible (and more likely) to be able to reuse data when navigating back to a page,
// tab or piece of content that has been visited before. These settings together configure the cache
// to serve the last 250 records, so long as they are less than 5 minutes old:
const gcReleaseBufferSize = 250
const queryCacheExpirationTime = ms`5m`

const GRAPHQL_URL = process.env.REACT_APP_AWS_API_ENDPOINT
if (!GRAPHQL_URL) {
  throw new Error('AWS URL MISSING FROM ENVIRONMENT')
}

const RETRY_TIME_MS = [3200, 6400, 12800]
const MAX_RETRIES = 3

// This network layer must not cache, or it will break cache-evicting network policies
const network = new RelayNetworkLayer([
  urlMiddleware({
    url: GRAPHQL_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  }),
  retryMiddleware({
    fetchTimeout: ms`30s`, // mirrors backend's timeout in case that fails
    retryDelays: (attempt) => RETRY_TIME_MS[attempt],
    statusCodes: (statusCode) => statusCode >= 500 && statusCode < 600,
    beforeRetry: ({ abort, attempt }) => {
      if (attempt > MAX_RETRIES) abort()
    },
  }),
  function logAndIgnoreErrors(next) {
    return async (req: RelayRequestAny) => {
      try {
        return await next(req)
      } catch (e) {
        console.error(e)
        return RelayNetworkLayerResponse.createFromGraphQL({ data: [] })
      }
    }
  },
])

export const CachingEnvironment = new Environment({
  network,
  store: new Store(new RecordSource(), { gcReleaseBufferSize, queryCacheExpirationTime }),
})
export default CachingEnvironment
