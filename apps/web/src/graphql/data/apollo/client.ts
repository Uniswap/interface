import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { createSubscriptionLink } from 'utilities/src/apollo/SubscriptionLink'
import { splitSubscription } from 'utilities/src/apollo/splitSubscription'
import { ChainId } from '@jaguarswap/sdk-core'

const CHAIN_SUBGRAPH_URL: Record<number, string> = {
  [ChainId.X1]: 'https://main-subgraph.jaguarex.com/subgraphs/name/jaguarswap/uniswap-v3',
  [ChainId.X1_TESTNET]: 'https://subgraph.jaguarex.com/subgraphs/name/jaguarswap/uniswap-v3',
}
const CHAIN_SUBGRAPH_URL_BLOCK: Record<number, string> = {
  [ChainId.X1]: 'https://main-subgraph.jaguarex.com/subgraphs/name/jaguarswap/x1layer-blocks',
  [ChainId.X1_TESTNET]: 'https://subgraph.jaguarex.com/subgraphs/name/jaguarswap/x1layer-blocks',
}


const httpLink = new HttpLink({ uri: CHAIN_SUBGRAPH_URL[ChainId.X1] })

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
const subscriptionLink = createSubscriptionLink({ uri: CHAIN_SUBGRAPH_URL[ChainId.X1], token: "" }, apolloClient)
apolloClient.setLink(splitSubscription(subscriptionLink, httpLink))
