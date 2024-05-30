import { ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from '@uniswap/sdk-core'
import { CHAIN_SUBGRAPH_URL, isSupportedChainId } from 'constants/chains'

import store from '../../state/index'

const httpLink = new HttpLink({ uri: CHAIN_SUBGRAPH_URL[ChainId.MAINNET] })

// This middleware will allow us to dynamically update the uri for the requests based off chainId
// For more information: https://www.apollographql.com/docs/react/networking/advanced-http-networking/
const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  const chainId = store.getState().application.chainId

  operation.setContext(() => ({
    uri:
      isSupportedChainId(chainId) && CHAIN_SUBGRAPH_URL[chainId]
        ? CHAIN_SUBGRAPH_URL[chainId]
        : CHAIN_SUBGRAPH_URL[ChainId.MAINNET],
  }))

  return forward(operation)
})

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: concat(authMiddleware, httpLink),
})

export const chainToApolloClient: Record<number, ApolloClient<NormalizedCacheObject>> = Object.fromEntries(
  Object.entries(CHAIN_SUBGRAPH_URL).map(([chainId, url]) => [
    chainId,
    new ApolloClient({
      cache: new InMemoryCache(),
      uri: url,
    }),
  ])
)
