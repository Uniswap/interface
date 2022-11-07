import ms from 'ms.macro'
import { Environment, Network, RecordSource, Store } from 'relay-runtime'

import fetchGraphQL from './fetchGraphQL'

// This makes it possible (and more likely) to be able to reuse data when navigating back to a page,
// tab or piece of content that has been visited before. These settings together configure the cache
// to serve the last 250 records, so long as they are less than 5 minutes old:
const gcReleaseBufferSize = 250
const queryCacheExpirationTime = ms`5m`

export const CachingEnvironment = new Environment({
  network: Network.create(fetchGraphQL),
  store: new Store(new RecordSource(), { gcReleaseBufferSize, queryCacheExpirationTime }),
})
export default CachingEnvironment
