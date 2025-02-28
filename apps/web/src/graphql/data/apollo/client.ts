import { ApolloClient, HttpLink } from '@apollo/client'
import { setupSharedApolloCache } from 'uniswap/src/data/cache'
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
    Origin: 'https://app.rigoblock.com',
  },
  cache: setupSharedApolloCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

// This is done after creating the client so that client may be passed to `createSubscriptionLink`.
const subscriptionLink = createSubscriptionLink({ uri: REALTIME_URL, token: REALTIME_TOKEN }, apolloClient)
apolloClient.setLink(splitSubscription(subscriptionLink, httpLink))
