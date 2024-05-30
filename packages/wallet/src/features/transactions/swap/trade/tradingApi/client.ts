import { ApolloClient, from } from '@apollo/client'
import { RestLink } from 'apollo-link-rest'
import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createNewInMemoryCache } from 'uniswap/src/data/cache'

const restLink = new RestLink({
  uri: uniswapUrls.tradingApiUrl,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': config.tradingApiKey,
    Origin: uniswapUrls.requestOriginUrl,
  },
})

export const TradingApiApolloClient = new ApolloClient({
  link: from([restLink]),
  cache: createNewInMemoryCache(),
  defaultOptions: {
    watchQuery: {
      // ensures query is returning data even if some fields errored out
      errorPolicy: 'all',
      // This isn't really being used because `useRestQuery` overrides this attribute.
      // We need to explicitly pass `fetchPolicy: 'no-cache'` when calling `useRestQuery` to apply this policy.
      fetchPolicy: 'no-cache',
    },
  },
})
