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
    function sumValues(
      result1: { data: GlobalData },
      result2: { data: GlobalData },
      result3: { data: GlobalData },
      field: string
    ) {
      return (
        parseFloat(result1?.data?.dmmFactories?.[0]?.[field] || '0') +
        parseFloat(result2?.data?.dmmFactories?.[0]?.[field] || '0') +
        parseFloat(result3?.data?.dmmFactories?.[0]?.[field] || '0')
      ).toString()
    }

    async function getGlobalData() {
      let result

      if (chainId === ChainId.MAINNET || chainId === ChainId.MATIC || chainId === ChainId.BSCMAINNET) {
        const resultMainnet: { data: GlobalData } = await exchangeCient[ChainId.MAINNET].query({
          query: GLOBAL_DATA(ChainId.MAINNET),
          fetchPolicy: 'cache-first'
        })

        const resultMatic: { data: GlobalData } = await exchangeCient[ChainId.MATIC].query({
          query: GLOBAL_DATA(ChainId.MATIC),
          fetchPolicy: 'cache-first'
        })

        const resultBSC: { data: GlobalData } = await exchangeCient[ChainId.BSCMAINNET].query({
          query: GLOBAL_DATA(ChainId.BSCMAINNET),
          fetchPolicy: 'cache-first'
        })

        result = {
          data: {
            dmmFactories: [
              {
                totalVolumeUSD: sumValues(resultMainnet, resultMatic, resultBSC, 'totalVolumeUSD'),
                totalVolumeETH: sumValues(resultMainnet, resultMatic, resultBSC, 'totalVolumeETH'),
                totalFeeUSD: sumValues(resultMainnet, resultMatic, resultBSC, 'totalFeeUSD'),
                untrackedVolumeUSD: sumValues(resultMainnet, resultMatic, resultBSC, 'untrackedVolumeUSD'),
                untrackedFeeUSD: sumValues(resultMainnet, resultMatic, resultBSC, 'untrackedFeeUSD'),
                totalLiquidityUSD: sumValues(resultMainnet, resultMatic, resultBSC, 'totalLiquidityUSD'),
                totalLiquidityETH: sumValues(resultMainnet, resultMatic, resultBSC, 'totalLiquidityETH'),
                totalAmplifiedLiquidityUSD: sumValues(
                  resultMainnet,
                  resultMatic,
                  resultBSC,
                  'totalAmplifiedLiquidityUSD'
                ),
                totalAmplifiedLiquidityETH: sumValues(
                  resultMainnet,
                  resultMatic,
                  resultBSC,
                  'totalAmplifiedLiquidityETH'
                )
              }
            ]
          }
        }
      } else if (chainId === ChainId.ROPSTEN || chainId === ChainId.MUMBAI || chainId === ChainId.BSCTESTNET) {
        const resultRopsten: { data: GlobalData } = await exchangeCient[ChainId.ROPSTEN].query({
          query: GLOBAL_DATA(ChainId.ROPSTEN),
          fetchPolicy: 'cache-first'
        })

        const resultMumbai: { data: GlobalData } = await exchangeCient[ChainId.MUMBAI].query({
          query: GLOBAL_DATA(ChainId.MUMBAI),
          fetchPolicy: 'cache-first'
        })

        const resultBscTestnet: { data: GlobalData } = await exchangeCient[ChainId.BSCTESTNET].query({
          query: GLOBAL_DATA(ChainId.BSCTESTNET),
          fetchPolicy: 'cache-first'
        })

        result = {
          data: {
            dmmFactories: [
              {
                totalVolumeUSD: sumValues(resultRopsten, resultMumbai, resultBscTestnet, 'totalVolumeUSD'),
                totalVolumeETH: sumValues(resultRopsten, resultMumbai, resultBscTestnet, 'totalVolumeETH'),
                totalFeeUSD: sumValues(resultRopsten, resultMumbai, resultBscTestnet, 'totalFeeUSD'),
                untrackedVolumeUSD: sumValues(resultRopsten, resultMumbai, resultBscTestnet, 'untrackedVolumeUSD'),
                untrackedFeeUSD: sumValues(resultRopsten, resultMumbai, resultBscTestnet, 'untrackedFeeUSD'),
                totalLiquidityUSD: sumValues(resultRopsten, resultMumbai, resultBscTestnet, 'totalLiquidityUSD'),
                totalLiquidityETH: sumValues(resultRopsten, resultMumbai, resultBscTestnet, 'totalLiquidityETH'),
                totalAmplifiedLiquidityUSD: sumValues(
                  resultRopsten,
                  resultMumbai,
                  resultBscTestnet,
                  'totalAmplifiedLiquidityUSD'
                ),
                totalAmplifiedLiquidityETH: sumValues(
                  resultRopsten,
                  resultMumbai,
                  resultBscTestnet,
                  'totalAmplifiedLiquidityETH'
                )
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
