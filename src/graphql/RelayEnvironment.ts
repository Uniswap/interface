import { Environment, Network, RecordSource, Store } from 'relay-runtime'

import fetchGraphQL from './data/fetchGraphQL'

// todo(jordan): stop only fetching data from aws here--https://github.com/relay-tools/relay-hooks/issues/59#issuecomment-595809130
// this should use metadata to determine which graphql server will receive the query

export default new Environment({
  network: Network.create(fetchGraphQL),
  store: new Store(new RecordSource()),
})
