import { ApolloClient, InMemoryCache } from '@apollo/client'
import { relayStylePagination } from '@apollo/client/utilities'
import { apolloDevToolsInit } from 'react-native-apollo-devtools-client'
import { config } from 'src/config'
import { uniswapUrls } from 'src/constants/urls'

export const client = new ApolloClient({
  uri: uniswapUrls.graphQLUrl,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': config.uniswapApiKey,
    // TODO: remove once API gateway supports mobile origin URL
    Origin: uniswapUrls.apiBaseUrl,
  },
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // relayStylePagination function unfortunately generates a field policy that ignores args
          nftBalances: relayStylePagination(),
        },
      },
    },
  }),
})

export function refetchAllQueries() {
  return client.refetchQueries({
    include: 'active',
  })
}

if (__DEV__) {
  // initializes the Flipper Apollo DevTools
  // requires the `react-native-apollo-devtools` plugin installed in Flipper
  apolloDevToolsInit(client)
}
