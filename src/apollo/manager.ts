import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from 'libs/sdk/src'
import { SUBGRAPH_BLOCK_NUMBER } from './queries'

const EXCHANGE_SUBGRAPH_URLS = {
  mainnet: ['https://api.thegraph.com/subgraphs/name/dynamic-amm/dynamic-amm'],
  mainnetStaging: ['https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-staging'],
  ropsten: ['https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-ropsten'],
  polygon: [
    'https://api.thegraph.com/subgraphs/name/dynamic-amm/dmm-exchange-matic',
    'https://polygon-subgraph.knstats.com/subgraphs/name/dynamic-amm/dmm-exchange-matic'
  ],
  polygonStaging: ['https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-matic-staging'],
  mumbai: ['https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-mumbai'],
  bsc: [
    'https://api.thegraph.com/subgraphs/name/ducquangkstn/dmm-exchange-bsc',
    'https://bsc-subgraph.dmm.exchange/subgraphs/name/dynamic-amm/dmm-exchange-bsc'
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
    case ChainId.RINKEBY:
      return EXCHANGE_SUBGRAPH_URLS.ropsten
    case ChainId.GÖRLI:
      return EXCHANGE_SUBGRAPH_URLS.ropsten
    case ChainId.KOVAN:
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

  const subgraphPromises = subgraphClients.map(client =>
    client
      .query({
        query: SUBGRAPH_BLOCK_NUMBER(),
        fetchPolicy: 'network-only'
      })
      .catch(e => {
        console.error(e)
        return e
      })
  )

  const subgraphQueryResults = await Promise.all(subgraphPromises)

  const subgraphBlockNumbers = subgraphQueryResults.map(res =>
    res instanceof Error ? 0 : res?.data?._meta?.block?.number || 0
  )

  let bestIndex = 0
  let maxBlockNumber = 0

  for (let i = 0; i < subgraphClients.length; i += 1) {
    if (subgraphBlockNumbers[i] > maxBlockNumber) {
      maxBlockNumber = subgraphBlockNumbers[i]
      bestIndex = i
    }
  }

  return subgraphClients[bestIndex]
}
