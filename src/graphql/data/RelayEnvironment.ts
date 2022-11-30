import ms from 'ms.macro'
import { RelayNetworkLayer, retryMiddleware, urlMiddleware } from 'react-relay-network-modern'
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

function getDelayWithBackoff(attempt: number) {
  return Math.pow(2, attempt + 4) * 100 // or simple array [3200, 6400, 12800]
}

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
    fetchTimeout: ms`30s`,
    retryDelays: getDelayWithBackoff,
    statusCodes: [500, 503, 504],
    beforeRetry: ({ abort, attempt }) => {
      if (attempt > MAX_RETRIES) abort()
    },
  }),
])

export const CachingEnvironment = new Environment({
  network,
  store: new Store(new RecordSource(), { gcReleaseBufferSize, queryCacheExpirationTime }),
})
export default CachingEnvironment
