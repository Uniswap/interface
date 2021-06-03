import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from 'libs/sdk/src'

export const defaultExchangeClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  uri: process.env.REACT_APP_SUBGRAPH_URL,
  cache: new InMemoryCache()
})

export const ropstenExchangeClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/edwardevans094/devdmm',
  cache: new InMemoryCache()
})

export const mainnetExchangeClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/dynamic-amm/dynamic-amm',
  cache: new InMemoryCache()
})

export const maticExchangeClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/dynamic-amm/dynamic-amm-matic',
  cache: new InMemoryCache()
})

export const mumbaiExchangeClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-mumbai',
  cache: new InMemoryCache()
})

export const exchangeCient: { [chainId in ChainId]: ApolloClient<NormalizedCacheObject> } = {
  [ChainId.MAINNET]: mainnetExchangeClient,
  [ChainId.ROPSTEN]: ropstenExchangeClient,
  [ChainId.RINKEBY]: ropstenExchangeClient,
  [ChainId.GÖRLI]: ropstenExchangeClient,
  [ChainId.KOVAN]: ropstenExchangeClient,
  [ChainId.MATIC]: maticExchangeClient,
  [ChainId.MUMBAI]: mumbaiExchangeClient
}

export const ropstenBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/edwardevans094/ropsten-blocks',
  cache: new InMemoryCache()
})

export const mainnetBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
  cache: new InMemoryCache()
})

export const maticBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
  cache: new InMemoryCache()
})

export const mumbaiBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/piavgh/mumbai-blocks',
  cache: new InMemoryCache()
})

export const blockClient: { [chainId in ChainId]: ApolloClient<NormalizedCacheObject> } = {
  [ChainId.MAINNET]: mainnetBlockClient,
  [ChainId.ROPSTEN]: ropstenBlockClient,
  [ChainId.RINKEBY]: ropstenBlockClient,
  [ChainId.GÖRLI]: ropstenBlockClient,
  [ChainId.KOVAN]: ropstenBlockClient,
  [ChainId.MATIC]: maticBlockClient,
  [ChainId.MUMBAI]: mumbaiBlockClient
}
