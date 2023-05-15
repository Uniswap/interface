import { ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { SupportedChainId } from 'constants/chains'

import store from '../../state/index'
import { useWeb3React } from '@web3-react/core'

const CHAIN_SUBGRAPH_URL: Record<number, string> = {
  [SupportedChainId.POLYGON_MUMBAI]: 'https://api.studio.thegraph.com/query/40393/limitless-subgraph-mumbai/0.0.20',
}

const httpLink = new HttpLink({ uri: CHAIN_SUBGRAPH_URL[SupportedChainId.MAINNET] })

// This middleware will allow us to dynamically update the uri for the requests based off chainId
// For more information: https://www.apollographql.com/docs/react/networking/advanced-http-networking/
const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  const chainId = store.getState().application.chainId

  operation.setContext(() => ({
    uri:
      chainId && CHAIN_SUBGRAPH_URL[chainId]
        ? CHAIN_SUBGRAPH_URL[chainId]
        : CHAIN_SUBGRAPH_URL[SupportedChainId.MAINNET],
  }))

  return forward(operation)
})

export const limitlessClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: concat(authMiddleware, httpLink),
})

export function useLimitlessSubgraph(): ApolloClient<NormalizedCacheObject> {
  // const [activeNetwork] = useActiveNetworkVersion()
  const { chainId } = useWeb3React()
  switch (chainId) {
    case SupportedChainId.MAINNET://SupportedNetwork.ETHEREUM:
    case SupportedChainId.ARBITRUM_ONE://SupportedNetwork.ARBITRUM:
    case SupportedChainId.OPTIMISM://SupportedNetwork.OPTIMISM:
    case SupportedChainId.POLYGON:// SupportedNetwork.POLYGON:

    case SupportedChainId.CELO:// SupportedNetwork.CELO:

    case SupportedChainId.BNB://SupportedNetwork.BNB:

    default:
      return limitlessClient
  }
}