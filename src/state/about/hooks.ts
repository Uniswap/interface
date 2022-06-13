import { useEffect, useState } from 'react'

import { GLOBAL_DATA } from 'apollo/queries'
import { useActiveWeb3React } from 'hooks'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useBlockNumber } from 'state/application/hooks'
import { getExchangeSubgraphUrls } from 'apollo/manager'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import useAggregatorVolume from 'hooks/useAggregatorVolume'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import useAggregatorAPR from 'hooks/useAggregatorAPR'

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
  aggregatorData?: {
    totalVolume?: string
    last24hVolume?: string
    maxApr?: {
      value: number
      id: string
      chain_id: number
      is_farm: boolean
    }
    totalEarnings?: number
  }
}

export function useGlobalData() {
  const { chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const [globalData, setGlobalData] = useState<GlobalData>()
  const aggregatorData = useAggregatorVolume()
  const aggregatorAPR = useAggregatorAPR()

  useEffect(() => {
    const getSumValues = (results: { data: GlobalData }[], field: string) => {
      return results
        .reduce((total, item) => {
          if (!item?.data?.dmmFactories?.length) return 0
          const sum = item.data.dmmFactories.reduce((sum, factory) => sum + parseFloat(factory[field] || '0'), 0)
          return total + sum
        }, 0)
        .toString()
    }
    const getResultByChainIds = async (chainIds: readonly ChainId[]) => {
      const allChainPromises = chainIds.map(chain => {
        const subgraphPromises = getExchangeSubgraphUrls(chain)
          .map(uri => new ApolloClient({ uri, cache: new InMemoryCache() }))
          .map(client =>
            client.query({
              query: GLOBAL_DATA(chain),
              fetchPolicy: 'no-cache',
            }),
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
              totalAmplifiedLiquidityETH: getSumValues(queryResult, 'totalAmplifiedLiquidityETH'),
            },
          ],
        },
      }
    }

    async function getGlobalData() {
      const result = await getResultByChainIds(SUPPORTED_NETWORKS)

      setGlobalData({
        ...result.data,
        aggregatorData: {
          totalVolume: aggregatorData?.totalVolume,
          last24hVolume: aggregatorData?.last24hVolume,
          maxApr: aggregatorAPR?.max_apr,
          totalEarnings: aggregatorAPR?.total_earnings,
        },
      })
    }

    getGlobalData()
  }, [chainId, blockNumber, aggregatorData, aggregatorAPR])

  return globalData
}
