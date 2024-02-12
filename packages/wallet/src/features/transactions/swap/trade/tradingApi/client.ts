import { ApolloClient, from } from '@apollo/client'
import { RestLink } from 'apollo-link-rest'
import { config } from 'wallet/src/config'
import { createNewInMemoryCache } from 'wallet/src/data/cache'

const restLink = new RestLink({
  uri: config.uniswapApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': config.tradingApiKey,
    Origin: config.uniswapAppUrl,
  },
})

export const TradingApiApolloClient = new ApolloClient({
  link: from([restLink]),
  cache: createNewInMemoryCache(),
  defaultOptions: {
    watchQuery: {
      // ensures query is returning data even if some fields errored out
      errorPolicy: 'all',
      fetchPolicy: 'network-only',
    },
  },
})
