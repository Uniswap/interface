import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { GraphQLClient } from 'graphql-request'
import { ChainId } from '@swapr/sdk'

export const defaultSubgraphClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-mainnet-v2',
  cache: new InMemoryCache()
})

export const oldBuildClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-arbitrum-one',
  cache: new InMemoryCache()
})

export const subgraphClients: { [chainId in ChainId]: ApolloClient<NormalizedCacheObject> } = {
  [ChainId.MAINNET]: defaultSubgraphClient,
  [ChainId.RINKEBY]: new ApolloClient({
    // uri: 'https://api.thegraph.com/subgraphs/name/luzzif/swapr-rinkeby-new',
    uri: 'https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-rinkeby',
    cache: new InMemoryCache()
  }),
  [ChainId.XDAI]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-xdai-v2',
    cache: new InMemoryCache()
  }),
  [ChainId.ARBITRUM_ONE]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-arbitrum-one-v3',
    cache: new InMemoryCache()
  }),
  [ChainId.ARBITRUM_RINKEBY]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-arbitrum-rinkeby-v2',
    cache: new InMemoryCache()
  })
}

export const immediateSubgraphClients: { [chainId in ChainId]: GraphQLClient } = {
  [ChainId.MAINNET]: new GraphQLClient('https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-mainnet-v2'),
  [ChainId.RINKEBY]: new GraphQLClient('https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-rinkeby'),
  [ChainId.XDAI]: new GraphQLClient('https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-xdai-v2'),
  [ChainId.ARBITRUM_ONE]: new GraphQLClient('https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-arbitrum-one-v3'),
  [ChainId.ARBITRUM_RINKEBY]: new GraphQLClient(
    'https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-arbitrum-rinkeby-v2'
  )
}

export const immediateCarrotSubgraphClients: { [chainId: number]: GraphQLClient } = {
  [ChainId.RINKEBY]: new GraphQLClient('https://api.thegraph.com/subgraphs/name/luzzif/carrot-rinkeby'),
  [ChainId.XDAI]: new GraphQLClient('https://api.thegraph.com/subgraphs/name/luzzif/carrot-xdai')
}

export const carrotSubgraphClient: { [chainId: number]: ApolloClient<NormalizedCacheObject> } = {
  [ChainId.RINKEBY]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/luzzif/carrot-rinkeby',
    cache: new InMemoryCache()
  }),
  [ChainId.XDAI]: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/luzzif/carrot-xdai',
    cache: new InMemoryCache()
  })
}
