import { useEffect, useState } from 'react'

import { exchangeCient } from 'apollo/client'
import { GLOBAL_DATA } from 'apollo/queries'
import { useActiveWeb3React } from 'hooks'
import { ChainId } from 'libs/sdk/src'
import { useBlockNumber } from 'state/application/hooks'

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
  const [globalData, setGlobalData] = useState<GlobalData>()

  useEffect(() => {
    function sumValues(result1: { data: GlobalData }, result2: { data: GlobalData }, field: string) {
      return (
        parseFloat(result1?.data?.dmmFactories?.[0]?.[field] || '0') +
        parseFloat(result2?.data?.dmmFactories?.[0]?.[field] || '0')
      ).toString()
    }

    async function getGlobalData() {
      let result

      if (chainId === ChainId.MAINNET || chainId === ChainId.MATIC) {
        const resultMainnet: { data: GlobalData } = await exchangeCient[ChainId.MAINNET].query({
          query: GLOBAL_DATA(ChainId.MAINNET),
          fetchPolicy: 'cache-first'
        })

        const resultMatic: { data: GlobalData } = await exchangeCient[ChainId.MATIC].query({
          query: GLOBAL_DATA(ChainId.MATIC),
          fetchPolicy: 'cache-first'
        })

        result = {
          data: {
            dmmFactories: [
              {
                totalVolumeUSD: sumValues(resultMainnet, resultMatic, 'totalVolumeUSD'),
                totalVolumeETH: sumValues(resultMainnet, resultMatic, 'totalVolumeETH'),
                totalFeeUSD: sumValues(resultMainnet, resultMatic, 'totalFeeUSD'),
                untrackedVolumeUSD: sumValues(resultMainnet, resultMatic, 'untrackedVolumeUSD'),
                untrackedFeeUSD: sumValues(resultMainnet, resultMatic, 'untrackedFeeUSD'),
                totalLiquidityUSD: sumValues(resultMainnet, resultMatic, 'totalLiquidityUSD'),
                totalLiquidityETH: sumValues(resultMainnet, resultMatic, 'totalLiquidityETH'),
                totalAmplifiedLiquidityUSD: sumValues(resultMainnet, resultMatic, 'totalAmplifiedLiquidityUSD'),
                totalAmplifiedLiquidityETH: sumValues(resultMainnet, resultMatic, 'totalAmplifiedLiquidityETH')
              }
            ]
          }
        }
      } else if (chainId === ChainId.ROPSTEN || chainId === ChainId.MUMBAI) {
        const resultRopsten: { data: GlobalData } = await exchangeCient[ChainId.ROPSTEN].query({
          query: GLOBAL_DATA(ChainId.ROPSTEN),
          fetchPolicy: 'cache-first'
        })

        const resultMumbai: { data: GlobalData } = await exchangeCient[ChainId.MUMBAI].query({
          query: GLOBAL_DATA(ChainId.MUMBAI),
          fetchPolicy: 'cache-first'
        })

        result = {
          data: {
            dmmFactories: [
              {
                totalVolumeUSD: sumValues(resultRopsten, resultMumbai, 'totalVolumeUSD'),
                totalVolumeETH: sumValues(resultRopsten, resultMumbai, 'totalVolumeETH'),
                totalFeeUSD: sumValues(resultRopsten, resultMumbai, 'totalFeeUSD'),
                untrackedVolumeUSD: sumValues(resultRopsten, resultMumbai, 'untrackedVolumeUSD'),
                untrackedFeeUSD: sumValues(resultRopsten, resultMumbai, 'untrackedFeeUSD'),
                totalLiquidityUSD: sumValues(resultRopsten, resultMumbai, 'totalLiquidityUSD'),
                totalLiquidityETH: sumValues(resultRopsten, resultMumbai, 'totalLiquidityETH'),
                totalAmplifiedLiquidityUSD: sumValues(resultRopsten, resultMumbai, 'totalAmplifiedLiquidityUSD'),
                totalAmplifiedLiquidityETH: sumValues(resultRopsten, resultMumbai, 'totalAmplifiedLiquidityETH')
              }
            ]
          }
        }
      } else {
        result = await exchangeCient[chainId as ChainId].query({
          query: GLOBAL_DATA(chainId as ChainId),
          fetchPolicy: 'cache-first'
        })
      }

      setGlobalData(result.data)
    }

    getGlobalData()
  }, [chainId, blockNumber])

  return globalData
}
