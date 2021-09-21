import { useEffect, useState } from 'react'

import { exchangeClient } from 'apollo/client'
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
      result4: { data: GlobalData },
      field: string
    ) {
      return (
        parseFloat(result1?.data?.dmmFactories?.[0]?.[field] || '0') +
        parseFloat(result2?.data?.dmmFactories?.[0]?.[field] || '0') +
        parseFloat(result3?.data?.dmmFactories?.[0]?.[field] || '0') +
        parseFloat(result4?.data?.dmmFactories?.[0]?.[field] || '0')
      ).toString()
    }

    async function getGlobalData() {
      let result

      if (
        chainId === ChainId.MAINNET ||
        chainId === ChainId.MATIC ||
        chainId === ChainId.BSCMAINNET ||
        chainId === ChainId.AVAXMAINNET
      ) {
        const resultMainnet: { data: GlobalData } = await exchangeClient[ChainId.MAINNET].query({
          query: GLOBAL_DATA(ChainId.MAINNET),
          fetchPolicy: 'cache-first'
        })
        const resultMatic: { data: GlobalData } = await exchangeClient[ChainId.MATIC].query({
          query: GLOBAL_DATA(ChainId.MATIC),
          fetchPolicy: 'cache-first'
        })

        const resultBSC: { data: GlobalData } = await exchangeClient[ChainId.BSCMAINNET].query({
          query: GLOBAL_DATA(ChainId.BSCMAINNET),
          fetchPolicy: 'cache-first'
        })

        const resultAVAX: { data: GlobalData } = await exchangeClient[ChainId.AVAXMAINNET].query({
          query: GLOBAL_DATA(ChainId.BSCMAINNET),
          fetchPolicy: 'cache-first'
        })

        result = {
          data: {
            dmmFactories: [
              {
                totalVolumeUSD: sumValues(resultMainnet, resultMatic, resultBSC, resultAVAX, 'totalVolumeUSD'),
                totalVolumeETH: sumValues(resultMainnet, resultMatic, resultBSC, resultAVAX, 'totalVolumeETH'),
                totalFeeUSD: sumValues(resultMainnet, resultMatic, resultBSC, resultAVAX, 'totalFeeUSD'),
                untrackedVolumeUSD: sumValues(resultMainnet, resultMatic, resultBSC, resultAVAX, 'untrackedVolumeUSD'),
                untrackedFeeUSD: sumValues(resultMainnet, resultMatic, resultBSC, resultAVAX, 'untrackedFeeUSD'),
                totalLiquidityUSD: sumValues(resultMainnet, resultMatic, resultBSC, resultAVAX, 'totalLiquidityUSD'),
                totalLiquidityETH: sumValues(resultMainnet, resultMatic, resultBSC, resultAVAX, 'totalLiquidityETH'),
                totalAmplifiedLiquidityUSD: sumValues(
                  resultMainnet,
                  resultMatic,
                  resultBSC,
                  resultAVAX,
                  'totalAmplifiedLiquidityUSD'
                ),
                totalAmplifiedLiquidityETH: sumValues(
                  resultMainnet,
                  resultMatic,
                  resultBSC,
                  resultAVAX,
                  'totalAmplifiedLiquidityETH'
                )
              }
            ]
          }
        }
      } else if (
        chainId === ChainId.ROPSTEN ||
        chainId === ChainId.MUMBAI ||
        chainId === ChainId.BSCTESTNET ||
        chainId === ChainId.AVAXTESTNET
      ) {
        const resultRopsten: { data: GlobalData } = await exchangeClient[ChainId.ROPSTEN].query({
          query: GLOBAL_DATA(ChainId.ROPSTEN),
          fetchPolicy: 'cache-first'
        })

        const resultMumbai: { data: GlobalData } = await exchangeClient[ChainId.MUMBAI].query({
          query: GLOBAL_DATA(ChainId.MUMBAI),
          fetchPolicy: 'cache-first'
        })

        const resultBscTestnet: { data: GlobalData } = await exchangeClient[ChainId.BSCTESTNET].query({
          query: GLOBAL_DATA(ChainId.BSCTESTNET),
          fetchPolicy: 'cache-first'
        })

        const resultAvaxTestnet: { data: GlobalData } = await exchangeClient[ChainId.AVAXTESTNET].query({
          query: GLOBAL_DATA(ChainId.BSCTESTNET),
          fetchPolicy: 'cache-first'
        })

        result = {
          data: {
            dmmFactories: [
              {
                totalVolumeUSD: sumValues(
                  resultRopsten,
                  resultMumbai,
                  resultBscTestnet,
                  resultAvaxTestnet,
                  'totalVolumeUSD'
                ),
                totalVolumeETH: sumValues(
                  resultRopsten,
                  resultMumbai,
                  resultBscTestnet,
                  resultAvaxTestnet,
                  'totalVolumeETH'
                ),
                totalFeeUSD: sumValues(resultRopsten, resultMumbai, resultBscTestnet, resultAvaxTestnet, 'totalFeeUSD'),
                untrackedVolumeUSD: sumValues(
                  resultRopsten,
                  resultMumbai,
                  resultBscTestnet,
                  resultAvaxTestnet,
                  'untrackedVolumeUSD'
                ),
                untrackedFeeUSD: sumValues(
                  resultRopsten,
                  resultMumbai,
                  resultBscTestnet,
                  resultAvaxTestnet,
                  'untrackedFeeUSD'
                ),
                totalLiquidityUSD: sumValues(
                  resultRopsten,
                  resultMumbai,
                  resultBscTestnet,
                  resultAvaxTestnet,
                  'totalLiquidityUSD'
                ),
                totalLiquidityETH: sumValues(
                  resultRopsten,
                  resultMumbai,
                  resultBscTestnet,
                  resultAvaxTestnet,
                  'totalLiquidityETH'
                ),
                totalAmplifiedLiquidityUSD: sumValues(
                  resultRopsten,
                  resultMumbai,
                  resultBscTestnet,
                  resultAvaxTestnet,
                  'totalAmplifiedLiquidityUSD'
                ),
                totalAmplifiedLiquidityETH: sumValues(
                  resultRopsten,
                  resultMumbai,
                  resultBscTestnet,
                  resultAvaxTestnet,
                  'totalAmplifiedLiquidityETH'
                )
              }
            ]
          }
        }
      } else {
        result = await exchangeClient[chainId as ChainId].query({
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
