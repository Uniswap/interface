import { Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { useEffect, useMemo, useState } from 'react'

import { POOL_POSITION_COUNT } from 'apollo/queries/promm'
import { useActiveWeb3React } from 'hooks'
import { useProAmmPoolInfos } from 'hooks/useProAmmPoolInfo'
import { useKyberSwapConfig } from 'state/application/hooks'

export const useFeeTierDistribution = (
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
): { [key in FeeAmount]: number } => {
  const { isEVM, networkInfo } = useActiveWeb3React()
  const { elasticClient } = useKyberSwapConfig()
  const feeAmounts = useMemo(() => {
    return [FeeAmount.HIGH, FeeAmount.LOW, FeeAmount.LOWEST, FeeAmount.STABLE, FeeAmount.MEDIUM]
  }, [])

  const poolIds = useProAmmPoolInfos(currencyA, currencyB, feeAmounts).filter(Boolean)

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
    if (!isEVM) return
    if (!poolIds.length) return
    elasticClient
      .query({
        query: POOL_POSITION_COUNT(poolIds),
      })
      .then(res => {
        const feeArray: { feeTier: string; activePositions: number }[] = res?.data?.pools?.map(
          (item: { positionCount: string; closedPositionCount: string; feeTier: string }) => {
            const activePositions = Number(item.positionCount) - Number(item.closedPositionCount)
            return {
              feeTier: item.feeTier,
              activePositions,
            }
          },
        )

        const totalPositions = feeArray.reduce((total, cur) => total + cur.activePositions, 0)

        if (!totalPositions) return
        setFeeTierDistribution(
          Object.keys(FeeAmount).reduce((acc, cur) => {
            const temp = feeArray.find(item => item.feeTier === cur)
            return {
              ...acc,
              [cur]: temp ? (temp.activePositions * 100) / totalPositions : 0,
            }
          }, initState),
        )
      })
      .catch(err => console.warn({ err }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initState, JSON.stringify(poolIds), isEVM, networkInfo])

  return feeTierDistribution
}
