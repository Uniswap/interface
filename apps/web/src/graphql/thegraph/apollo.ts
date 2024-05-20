import { ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from '@ubeswap/sdk-core'

import store from '../../state/index'

const CHAIN_SUBGRAPH_URL: Record<number, string> = {
  [ChainId.MAINNET]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3?source=uniswap',
  [ChainId.CELO]:
    'https://gateway-arbitrum.network.thegraph.com/api/4271ef6e8196c6631ad397c7be19082a/subgraphs/id/HsmR9eEf8v77bGBgpHMNbLh36Z1kkeMc654YWDepNcNf',
}

const httpLink = new HttpLink({ uri: CHAIN_SUBGRAPH_URL[ChainId.CELO] })

// This middleware will allow us to dynamically update the uri for the requests based off chainId
// For more information: https://www.apollographql.com/docs/react/networking/advanced-http-networking/
const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  const chainId = store.getState().application.chainId

  operation.setContext(() => ({
    uri: chainId && CHAIN_SUBGRAPH_URL[chainId] ? CHAIN_SUBGRAPH_URL[chainId] : CHAIN_SUBGRAPH_URL[ChainId.CELO],
  }))

  return forward(operation)
})

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: concat(authMiddleware, httpLink),
})

export const chainToApolloClient: Record<number, ApolloClient<NormalizedCacheObject>> = {
  [ChainId.MAINNET]: new ApolloClient({
    cache: new InMemoryCache(),
    uri: CHAIN_SUBGRAPH_URL[ChainId.MAINNET],
  }),
  [ChainId.CELO]: new ApolloClient({
    cache: new InMemoryCache(),
    uri: CHAIN_SUBGRAPH_URL[ChainId.CELO],
  }),
}
