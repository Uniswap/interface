import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from '@swapr/sdk'

export const defaultSubgraphClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr-mainnet-alpha',
  cache: new InMemoryCache()
})

export const oldBuildClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr-arbitrum-rinkeby', // TODO: change to Arb1 once going live
  cache: new InMemoryCache()
})

export const subgraphClients: { [chainId in ChainId]?: ApolloClient<NormalizedCacheObject> | undefined } = {
  [ChainId.MAINNET]: defaultSubgraphClient,
  [ChainId.RINKEBY]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr_rinkeby',
    cache: new InMemoryCache()
  }),
  [ChainId.XDAI]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr-xdai',
    cache: new InMemoryCache()
  }),
  [ChainId.ARBITRUM_ONE]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr-arbitrum-one',
    cache: new InMemoryCache()
  }),
  [ChainId.ARBITRUM_RINKEBY]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr-arbitrum-rinkeby-new',
    cache: new InMemoryCache()
  })
}
