import ms from 'ms.macro'
import { Variables } from 'react-relay'
import { Environment, Network, RecordSource, RequestParameters, Store } from 'relay-runtime'
import RelayQueryResponseCache from 'relay-runtime/lib/network/RelayQueryResponseCache'

import fetchGraphQL from './fetchGraphQL'

export const cache = new RelayQueryResponseCache({ size: 250, ttl: ms`5m` })

const fetchQuery = async function wrappedFetchQuery(params: RequestParameters, variables: Variables) {
  const queryID = params.name
  const cachedData = cache.get(queryID, variables)

  if (cachedData !== null) return cachedData

  return fetchGraphQL(params, variables).then((data) => {
    if (params.operationKind !== 'mutation') {
      cache.set(queryID, variables, data)
    }
    return data
  })
}

// This property tells Relay to not immediately clear its cache when the user
// navigates around the app. Relay will hold onto the specified number of
// query results, allowing the user to return to recently visited pages
// and reusing cached data if its available/fresh.
const gcReleaseBufferSize = 10

const store = new Store(new RecordSource(), { gcReleaseBufferSize })
const network = Network.create(fetchQuery)

// Export a singleton instance of Relay Environment configured with our network function:
export default new Environment({
  network,
  store,
})
