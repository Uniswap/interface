import { useEffect, useState } from 'react'

import { GLOBAL_DATA } from 'apollo/queries'
import { useActiveWeb3React } from 'hooks'
import { ChainId } from '@dynamic-amm/sdk'
import { useBlockNumber, useExchangeClient } from 'state/application/hooks'
import { getExchangeSubgraphUrls } from 'apollo/manager'
import { ApolloClient, InMemoryCache } from '@apollo/client'

interface GlobalData {
  dmmFactories: {
    totalVolumeUSD: string
    totalVolumeETH: string
    totalFeeUSD: string
    untrackedVolumeUSD: string
    untrackedFeeUSD: string
    totalLiquidityUSD: string
    totalLiquidityETH: string
    totalAmplifiedLiquidityUSD: string
    totalAmplifiedLiquidityETH: string
    [key: string]: string
  }[]
}

export function useGlobalData() {
  const { chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const apolloClient = useExchangeClient()
  const [globalData, setGlobalData] = useState<GlobalData>()

  useEffect(() => {
    const getSumValues = (results: { data: GlobalData }[], field: string) => {
      return results
        .reduce((total, item) => total + parseFloat(item?.data?.dmmFactories?.[0]?.[field] || '0'), 0)
        .toString()
    }

    const getResultByChainIds = async (chainIds: ChainId[]) => {
      const allChainPromises = chainIds.map(chain => {
        const subgraphPromises = getExchangeSubgraphUrls(chain)
          .map(uri => new ApolloClient({ uri, cache: new InMemoryCache() }))
          .map(client =>
            client.query({
              query: GLOBAL_DATA(chain),
              fetchPolicy: 'cache-first'
            })
          )
        return subgraphPromises
      })

      const queryResult = (
        await Promise.all(allChainPromises.map(promises => Promise.any(promises.map(p => p.catch(e => e)))))
      ).filter(res => !(res instanceof Error))

      return {
        data: {
          dmmFactories: [
            {
              totalVolumeUSD: getSumValues(queryResult, 'totalVolumeUSD'),
              totalVolumeETH: getSumValues(queryResult, 'totalVolumeETH'),
              totalFeeUSD: getSumValues(queryResult, 'totalFeeUSD'),
              untrackedVolumeUSD: getSumValues(queryResult, 'untrackedVolumeUSD'),
              untrackedFeeUSD: getSumValues(queryResult, 'untrackedFeeUSD'),
              totalLiquidityUSD: getSumValues(queryResult, 'totalLiquidityUSD'),
              totalLiquidityETH: getSumValues(queryResult, 'totalLiquidityETH'),
              totalAmplifiedLiquidityUSD: getSumValues(queryResult, 'totalAmplifiedLiquidityUSD'),
              totalAmplifiedLiquidityETH: getSumValues(queryResult, 'totalAmplifiedLiquidityETH')
            }
          ]
        }
      }
    }

    async function getGlobalData() {
      let result

      if (
        chainId === ChainId.MAINNET ||
        chainId === ChainId.MATIC ||
        chainId === ChainId.BSCMAINNET ||
        chainId === ChainId.AVAXMAINNET
      ) {
        result = await getResultByChainIds([ChainId.MAINNET, ChainId.MATIC, ChainId.BSCMAINNET, ChainId.AVAXMAINNET])
      } else if (
        chainId === ChainId.ROPSTEN ||
        chainId === ChainId.MUMBAI ||
        chainId === ChainId.BSCTESTNET ||
        chainId === ChainId.AVAXTESTNET
      ) {
        result = await getResultByChainIds([ChainId.ROPSTEN, ChainId.MUMBAI, ChainId.BSCTESTNET, ChainId.AVAXTESTNET])
      } else {
        result = await apolloClient.query({
          query: GLOBAL_DATA(chainId as ChainId),
          fetchPolicy: 'cache-first'
        })
      }

      setGlobalData(result.data)
    }

    getGlobalData()
  }, [chainId, blockNumber, apolloClient])

  return globalData
}
