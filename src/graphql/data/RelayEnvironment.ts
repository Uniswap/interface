import ms from 'ms.macro'
import {
  RelayNetworkLayer,
  RelayNetworkLayerResponse,
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

// This network layer must not cache, or it will break cache-evicting network policies
const network = new RelayNetworkLayer(
  [
    urlMiddleware({
      url: GRAPHQL_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    function logAndIgnoreErrors(next) {
      return async (req) => {
        try {
          const res = await next(req)
          if (!res || !res.data) throw new Error('Missing response data')
          return res
        } catch (e) {
          console.error(e)
          return RelayNetworkLayerResponse.createFromGraphQL({ data: [] })
        }
      }
    },
    retryMiddleware({
      fetchTimeout: ms`30s`, // mirrors backend's timeout in case that fails
      retryDelays: RETRY_TIME_MS,
      statusCodes: (statusCode) => statusCode >= 500 && statusCode < 600,
    }),
  ],
  { noThrow: true }
)

const CachingEnvironment = new Environment({
  network,
  store: new Store(new RecordSource(), { gcReleaseBufferSize, queryCacheExpirationTime }),
})
export default CachingEnvironment
