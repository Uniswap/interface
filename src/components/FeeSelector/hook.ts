import { Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { useProAmmPoolInfos } from 'hooks/useProAmmPoolInfo'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'constants/networks'
import { useEffect, useState, useMemo } from 'react'
import { POOL_POSITION_COUNT } from 'apollo/queries/promm'

export const useFeeTierDistribution = (
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
): { [key in FeeAmount]: number } => {
  const { chainId } = useActiveWeb3React()

  const feeAmounts = useMemo(() => {
    return [FeeAmount.HIGH, FeeAmount.LOW, FeeAmount.LOWEST, FeeAmount.STABLE, FeeAmount.MEDIUM]
  }, [])

  const poolIds = useProAmmPoolInfos(currencyA, currencyB, feeAmounts)

  const initState = useMemo(() => {
    return {
      [FeeAmount.HIGH]: 0,
      [FeeAmount.LOW]: 0,
      [FeeAmount.LOWEST]: 0,
      [FeeAmount.STABLE]: 0,
      [FeeAmount.MEDIUM]: 0,
    }
  }, [])

  const [feeTierDistribution, setFeeTierDistribution] = useState<{ [key in FeeAmount]: number }>(initState)

  // reset feeTierDistribution when change token
  useEffect(() => {
    setFeeTierDistribution(initState)
  }, [currencyA, currencyB, initState])

  useEffect(() => {
    if (!chainId) return
    NETWORKS_INFO[chainId].elasticClient
      .query({
        query: POOL_POSITION_COUNT(poolIds),
      })
      .then(res => {
        const feeArray: { feeTier: string; activePositions: number }[] = res?.data?.pools?.map(
          (item: { positionCount: string; closedPostionCount: string; feeTier: string }) => {
            const activePositions = Number(item.positionCount) - Number(item.closedPostionCount)
            return {
              feeTier: item.feeTier,
              activePositions,
            }
          },
        )

        const totalPostions = feeArray.reduce((total, cur) => total + cur.activePositions, 0)

        if (!totalPostions) return
        setFeeTierDistribution(
          Object.keys(FeeAmount).reduce((acc, cur) => {
            const temp = feeArray.find(item => item.feeTier === cur)
            return {
              ...acc,
              [cur]: temp ? (temp.activePositions * 100) / totalPostions : 0,
            }
          }, initState),
        )
      })
  }, [chainId, initState, poolIds])

  return feeTierDistribution
}
