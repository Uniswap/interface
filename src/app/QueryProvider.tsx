import { ApolloClient, ApolloProvider, InMemoryCache, TypePolicy } from '@apollo/client'
import React, { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import 'cross-fetch/polyfill'

const SUBGRAPH_URL = 'https://graphql-proxy-f184dc0990baf289.onporter.run/graphql'

const idAndChainIdPolicy: TypePolicy = {
  keyFields: ['chainId', 'id'],
  fields: {
    chainId: {
      read(_, { variables }) {
        return variables?.chainId
      },
    },
  },
}

const chainIdPolicy: TypePolicy = {
  keyFields: ['chainId'],
  fields: {
    chainId: {
      read(_, { variables }) {
        return variables?.chainId
      },
    },
  },
}

const apolloClient = new ApolloClient({
  uri: SUBGRAPH_URL,
  cache: new InMemoryCache({
    typePolicies: {
      v2_Token: idAndChainIdPolicy,
      v3_Token: idAndChainIdPolicy,
      v2_TokenDayData: idAndChainIdPolicy,
      v3_TokenDayData: idAndChainIdPolicy,
      v2_TokenHourData: idAndChainIdPolicy,
      v3_TokenHourData: idAndChainIdPolicy,
      v2_Bundle: chainIdPolicy,
      v3_Bundle: chainIdPolicy,
    },
  }),
})

const queryClient = new QueryClient()

export function QueryProvider({ children }: PropsWithChildren<{}>) {
  return (
    <ApolloProvider client={apolloClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApolloProvider>
  )
}
