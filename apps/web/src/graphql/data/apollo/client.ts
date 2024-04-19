import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { Reference, relayStylePagination } from '@apollo/client/utilities'
import { createSubscriptionLink } from 'utilities/src/apollo/SubscriptionLink'
import { splitSubscription } from 'utilities/src/apollo/splitSubscription'

const API_URL = process.env.REACT_APP_AWS_API_ENDPOINT
const REALTIME_URL = process.env.REACT_APP_AWS_REALTIME_ENDPOINT
const REALTIME_TOKEN = process.env.REACT_APP_AWS_REALTIME_TOKEN
if (!API_URL || !REALTIME_URL || !REALTIME_TOKEN) {
  throw new Error('AWS CONFIG MISSING FROM ENVIRONMENT')
}

const httpLink = new HttpLink({ uri: API_URL })

export const apolloClient = new ApolloClient({
  connectToDevTools: true,
  link: httpLink,
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://app.uniswap.org',
  },
  cache: new InMemoryCache({
    typePolicies: {
      Token: {
        // Tokens are cached by their chain/address (see Query.fields.token, above).
        // In any query for `token` or `tokens`, you *must* include `chain` and `address` fields in order
        // to properly normalize the result in the cache.
        keyFields: false,
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

// This is done after creating the client so that client may be passed to `createSubscriptionLink`.
const subscriptionLink = createSubscriptionLink({ uri: REALTIME_URL, token: REALTIME_TOKEN }, apolloClient)
apolloClient.setLink(splitSubscription(subscriptionLink, httpLink))
