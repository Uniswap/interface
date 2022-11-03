import { ApolloClient, InMemoryCache } from '@apollo/client'
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
  cache: new InMemoryCache(),
})

export function refetchAllQueries() {
  return client.refetchQueries({
    include: 'active',
  })
}
