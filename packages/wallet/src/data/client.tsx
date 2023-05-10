import { ApolloClient, ApolloProvider, createHttpLink, from, InMemoryCache } from '@apollo/client'
import { PropsWithChildren } from 'react'
import { config } from 'wallet/src/config'

const httpLink = createHttpLink({
  uri: `${config.uniswapApiBaseUrl}/v1/graphql`,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': config.uniswapApiKey ?? '',
  },
})

const client = new ApolloClient({
  link: from([httpLink]),
  cache: new InMemoryCache(),
})

export function GraphqlProvider({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <ApolloProvider client={client}>{children}</ApolloProvider>
}
