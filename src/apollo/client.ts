import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from '@swapr/sdk'

export const defaultSubgraphClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr-mainnet-v2',
  cache: new InMemoryCache()
})

export const oldBuildClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr-arbitrum-one',
  cache: new InMemoryCache()
})

export const subgraphClients: { [chainId in ChainId]?: ApolloClient<NormalizedCacheObject> | undefined } = {
  [ChainId.MAINNET]: defaultSubgraphClient,
  [ChainId.RINKEBY]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr-rinkeby-new',
    cache: new InMemoryCache()
  }),
  [ChainId.XDAI]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr-xdai-v2',
    cache: new InMemoryCache()
  }),
  [ChainId.ARBITRUM_ONE]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr-arbitrum-one-v3',
    cache: new InMemoryCache()
  }),
  [ChainId.ARBITRUM_RINKEBY]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr-arbitrum-rinkeby-v2',
    cache: new InMemoryCache()
  })
}
