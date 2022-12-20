import { ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache } from '@apollo/client'
import { SupportedChainId } from 'constants/chains'

import store, { AppState } from '../../state/index'

const CHAIN_SUBGRAPH_URL: Record<number, string> = {
  [SupportedChainId.MAINNET]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  [SupportedChainId.RINKEBY]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',

  [SupportedChainId.ARBITRUM_ONE]: 'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-minimal',

  [SupportedChainId.OPTIMISM]: 'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis',

  [SupportedChainId.POLYGON]: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',

  [SupportedChainId.CELO]: 'https://api.thegraph.com/subgraphs/name/jesse-sawa/uniswap-celo',
}

const httpLink = new HttpLink({ uri: CHAIN_SUBGRAPH_URL[SupportedChainId.MAINNET] })

// This middleware will allow us to dynamically update the uri for the requests based off chainId
// For more information: https://www.apollographql.com/docs/react/networking/advanced-http-networking/
const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  const chainId = (store.getState() as AppState).application.chainId

  operation.setContext(() => ({
    uri:
      chainId && CHAIN_SUBGRAPH_URL[chainId]
        ? CHAIN_SUBGRAPH_URL[chainId]
        : CHAIN_SUBGRAPH_URL[SupportedChainId.MAINNET],
  }))

  return forward(operation)
})

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: concat(authMiddleware, httpLink),
})
