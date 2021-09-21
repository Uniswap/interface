import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from 'libs/sdk/src'
import { SUBGRAPH_BLOCK_NUMBER } from './queries'

const EXCHANGE_SUBGRAPH_URLS = {
  mainnet: ['https://api.thegraph.com/subgraphs/name/dynamic-amm/dynamic-amm'],
  mainnetStaging: ['https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-staging'],
  ropsten: ['https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-ropsten'],
  polygon: [
    'https://polygon-subgraph.knstats.com/subgraphs/name/dynamic-amm/dmm-exchange-matic',
    'https://api.thegraph.com/subgraphs/name/dynamic-amm/dmm-exchange-matic'
  ],
  polygonStaging: ['https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-matic-staging'],
  mumbai: ['https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-mumbai'],
  bsc: [
    'https://bsc-subgraph.dmm.exchange/subgraphs/name/dynamic-amm/dmm-exchange-bsc',
    'https://api.thegraph.com/subgraphs/name/ducquangkstn/dmm-exchange-bsc'
  ],
  bscStaging: ['https://api.thegraph.com/subgraphs/name/ducquangkstn/dynamic-amm-bsc-staging'],
  bscTestnet: ['https://api.thegraph.com/subgraphs/name/ducquangkstn/dynamic-amm-ropsten'],
  avalanche: [
    'https://avax-subgraph.dmm.exchange/subgraphs/name/dynamic-amm/dmm-exchange-avax',
    'https://api.thegraph.com/subgraphs/name/dynamic-amm/dmm-exchange-avax'
  ],
  avalancheTestnet: ['https://api.thegraph.com/subgraphs/name/ducquangkstn/dmm-exchange-fuij']
}

export function getExchangeSubgraphUrls(networkId: ChainId): string[] {
  switch (networkId) {
    case ChainId.MAINNET:
      if (process.env.REACT_APP_MAINNET_ENV === 'staging') {
        return EXCHANGE_SUBGRAPH_URLS.mainnetStaging
      } else {
        return EXCHANGE_SUBGRAPH_URLS.mainnet
      }
    case ChainId.ROPSTEN:
      return EXCHANGE_SUBGRAPH_URLS.ropsten
    case ChainId.MATIC:
      if (process.env.REACT_APP_MAINNET_ENV === 'staging') {
        return EXCHANGE_SUBGRAPH_URLS.polygonStaging
      } else {
        return EXCHANGE_SUBGRAPH_URLS.polygon
      }
    case ChainId.MUMBAI:
      return EXCHANGE_SUBGRAPH_URLS.mumbai
    case ChainId.BSCMAINNET:
      if (process.env.REACT_APP_MAINNET_ENV === 'staging') {
        return EXCHANGE_SUBGRAPH_URLS.bscStaging
      } else {
        return EXCHANGE_SUBGRAPH_URLS.bsc
      }
    case ChainId.BSCTESTNET:
      return EXCHANGE_SUBGRAPH_URLS.bscTestnet
    case ChainId.AVAXMAINNET:
      return EXCHANGE_SUBGRAPH_URLS.avalanche
    case ChainId.AVAXTESTNET:
      return EXCHANGE_SUBGRAPH_URLS.avalancheTestnet
    default:
      return EXCHANGE_SUBGRAPH_URLS.mainnet
  }
}

export async function getExchangeSubgraphClient(chainId: ChainId): Promise<ApolloClient<NormalizedCacheObject>> {
  const subgraphUrls = getExchangeSubgraphUrls(chainId)

  if (subgraphUrls.length === 1) {
    return new ApolloClient({
      uri: subgraphUrls[0],
      cache: new InMemoryCache()
    })
  }

  const subgraphClients = subgraphUrls.map(
    uri =>
      new ApolloClient({
        uri,
        cache: new InMemoryCache()
      })
  )

  let bestIndex = 0
  let maxBlockNumber = 0

  for (let i = 0; i < subgraphClients.length; i += 1) {
    try {
      const result = await subgraphClients[i].query({
        query: SUBGRAPH_BLOCK_NUMBER(),
        fetchPolicy: 'network-only'
      })

      const blockNumber = result?.data?._meta?.block?.number

      if (blockNumber && blockNumber > maxBlockNumber) {
        maxBlockNumber = blockNumber
        bestIndex = i
      }
    } catch (err) {
      console.error(err)
    }
  }

  return subgraphClients[bestIndex]
}
