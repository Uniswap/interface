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

const MAX_RETRIES = 3
const network = new RelayNetworkLayer([
  urlMiddleware({
    url: GRAPHQL_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  }),
  retryMiddleware({
    fetchTimeout: ms`15s`,
    retryDelays: (attempt) => Math.pow(2, attempt + 4) * 100, // or simple array [3200, 6400, 12800],
    statusCodes: [500, 503, 504],
    beforeRetry: ({ abort, attempt }) => {
      if (attempt > MAX_RETRIES) abort()
      console.log(attempt)
    },
  }),
])

export const CachingEnvironment = new Environment({
  network,
  store: new Store(new RecordSource(), { gcReleaseBufferSize, queryCacheExpirationTime }),
})
export default CachingEnvironment
