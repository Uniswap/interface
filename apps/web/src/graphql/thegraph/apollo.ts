import { ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from '@jaguarswap/sdk-core'

import store from '../../state/index'

const CHAIN_SUBGRAPH_URL: Record<number, string> = {
  [ChainId.X1]: 'https://main-subgraph.jaguarex.com/subgraphs/name/jaguarswap/uniswap-v3',
  [ChainId.X1_TESTNET]: 'https://subgraph.jaguarex.com/subgraphs/name/jaguarswap/uniswap-v3',
}
const CHAIN_SUBGRAPH_URL_BLOCK: Record<number, string> = {
  [ChainId.X1]: 'https://main-subgraph.jaguarex.com/subgraphs/name/jaguarswap/x1layer-blocks',
  [ChainId.X1_TESTNET]: 'https://subgraph.jaguarex.com/subgraphs/name/jaguarswap/x1layer-blocks',
}

const httpLink = new HttpLink({ uri: CHAIN_SUBGRAPH_URL[ChainId.X1] })
const httpLinkBlock = new HttpLink({ uri: CHAIN_SUBGRAPH_URL_BLOCK[ChainId.X1] })

// This middleware will allow us to dynamically update the uri for the requests based off chainId
// For more information: https://www.apollographql.com/docs/react/networking/advanced-http-networking/
const authMiddleware = (subgraphUrl: Record<number, string>) => {
  return new ApolloLink((operation, forward) => {
    // add the authorization to the headers
    const chainId = store.getState().application.chainId

    operation.setContext(() => ({
      uri: chainId && subgraphUrl[chainId] ? subgraphUrl[chainId] : subgraphUrl[ChainId.X1],
    }))

    return forward(operation)
  })
}

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: concat(authMiddleware(CHAIN_SUBGRAPH_URL), httpLink),
})

export const apolloClientBlock = new ApolloClient({
  cache: new InMemoryCache(),
  link: concat(authMiddleware(CHAIN_SUBGRAPH_URL_BLOCK), httpLinkBlock),
})

export const chainToApolloClient: Record<number, ApolloClient<NormalizedCacheObject>> = {
  [ChainId.X1]: new ApolloClient({
    cache: new InMemoryCache(),
    uri: CHAIN_SUBGRAPH_URL[ChainId.X1],
  }),
  [ChainId.X1_TESTNET]: new ApolloClient({
    cache: new InMemoryCache(),
    uri: CHAIN_SUBGRAPH_URL[ChainId.X1_TESTNET],
  }),
}
