import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from 'libs/sdk/src'

export const defaultExchangeClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  uri:
    process.env.REACT_APP_MAINNET_ENV === 'staging'
      ? 'https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-staging'
      : 'https://api.thegraph.com/subgraphs/name/dynamic-amm/dynamic-amm',
  cache: new InMemoryCache()
})

const ropstenBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/edwardevans094/ropsten-blocks',
  cache: new InMemoryCache()
})

const mainnetBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
  cache: new InMemoryCache()
})

const maticBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ord786/matic-blocks',
  cache: new InMemoryCache()
})

const mumbaiBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/piavgh/mumbai-blocks',
  cache: new InMemoryCache()
})
const bscTestnetBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ducquangkstn/ethereum-blocks-bsctestnet',
  cache: new InMemoryCache()
})
const bscMainnetBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ducquangkstn/ethereum-blocks-bsc',
  cache: new InMemoryCache()
})

const avaxTestnetBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ducquangkstn/ethereum-block-fuji',
  cache: new InMemoryCache()
})

const avaxMainnetBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ducquangkstn/avalache-blocks',
  cache: new InMemoryCache()
})

export const blockClient: { [chainId in ChainId]: ApolloClient<NormalizedCacheObject> } = {
  [ChainId.MAINNET]: mainnetBlockClient,
  [ChainId.ROPSTEN]: ropstenBlockClient,
  [ChainId.RINKEBY]: ropstenBlockClient,
  [ChainId.GÖRLI]: ropstenBlockClient,
  [ChainId.KOVAN]: ropstenBlockClient,
  [ChainId.MATIC]: maticBlockClient,
  [ChainId.MUMBAI]: mumbaiBlockClient,
  [ChainId.BSCTESTNET]: bscTestnetBlockClient,
  [ChainId.BSCMAINNET]: bscMainnetBlockClient,
  [ChainId.AVAXTESTNET]: avaxTestnetBlockClient,
  [ChainId.AVAXMAINNET]: avaxMainnetBlockClient
}
