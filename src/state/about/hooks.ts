import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useState } from 'react'

import { GLOBAL_DATA, GLOBAL_DATA_ELASTIC } from 'apollo/queries'
import { EVM_MAINNET_NETWORKS, isEVM } from 'constants/networks'
import { ELASTIC_NOT_SUPPORTED, VERSION } from 'constants/v2'
import useAggregatorAPR from 'hooks/useAggregatorAPR'
import useAggregatorVolume from 'hooks/useAggregatorVolume'
import { useAllKyberswapConfig } from 'hooks/useKyberswapConfig'

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
      type?: VERSION.CLASSIC | VERSION.ELASTIC
    }
    totalEarnings?: number
  }
}

export function useGlobalData() {
  const [globalData, setGlobalData] = useState<GlobalData>()
  const aggregatorData = useAggregatorVolume()
  const aggregatorAPR = useAggregatorAPR()
  const allKyberswapConfig = useAllKyberswapConfig()

  useEffect(() => {
    const getSumValues = (results: { data: GlobalData }[], field: string) => {
      return results
        .reduce((total, item) => {
          if (!item?.data?.dmmFactories?.length) return total
          const sum = item.data.dmmFactories.reduce((sum, factory) => sum + parseFloat(factory[field] || '0'), 0)
          return total + sum
        }, 0)
        .toString()
    }
    const getResultByChainIds = async (chainIds: readonly ChainId[]) => {
      // todo namgold: add aggregator API for solana
      const elasticChains = chainIds.filter(isEVM).filter(id => !ELASTIC_NOT_SUPPORTED[id])

      const elasticPromises = elasticChains.map(chain =>
        allKyberswapConfig[chain].elasticClient.query({
          query: GLOBAL_DATA_ELASTIC(),
          fetchPolicy: 'cache-first',
        }),
      )

      const elasticResult = (await Promise.all(elasticPromises.map(promises => promises.catch(e => e)))).filter(
        res => !(res instanceof Error),
      )

      const tvlElastic = elasticResult.reduce((total, item) => {
        return total + parseFloat(item?.data?.factories?.[0]?.totalValueLockedUSD || '0')
      }, 0)

      const allChainPromises = chainIds.filter(isEVM).map(chain =>
        allKyberswapConfig[chain].classicClient.query({
          query: GLOBAL_DATA(),
          fetchPolicy: 'cache-first',
        }),
      )

      const queryResult = (await Promise.all(allChainPromises.map(promises => promises.catch(e => e)))).filter(
        res => !(res instanceof Error),
      )

      return {
        data: {
          dmmFactories: [
            {
              totalVolumeUSD: getSumValues(queryResult, 'totalVolumeUSD'),
              totalVolumeETH: getSumValues(queryResult, 'totalVolumeETH'),
              totalFeeUSD: getSumValues(queryResult, 'totalFeeUSD'),
              untrackedVolumeUSD: getSumValues(queryResult, 'untrackedVolumeUSD'),
              untrackedFeeUSD: getSumValues(queryResult, 'untrackedFeeUSD'),
              totalLiquidityUSD: parseFloat(getSumValues(queryResult, 'totalLiquidityUSD')) + tvlElastic,
              totalLiquidityETH: getSumValues(queryResult, 'totalLiquidityETH'),
              totalAmplifiedLiquidityUSD: getSumValues(queryResult, 'totalAmplifiedLiquidityUSD'),
              totalAmplifiedLiquidityETH: getSumValues(queryResult, 'totalAmplifiedLiquidityETH'),
            },
          ],
        },
      }
    }

    async function getGlobalData() {
      const result = await getResultByChainIds(EVM_MAINNET_NETWORKS.filter(chain => chain !== ChainId.ETHW))

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
  }, [aggregatorData, aggregatorAPR, allKyberswapConfig])

  return globalData
}
