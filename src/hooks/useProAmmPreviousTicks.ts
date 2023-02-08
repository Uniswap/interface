import { Pool, Position, TickMath } from '@kyberswap/ks-sdk-elastic'
import { BigNumber } from 'ethers'
import { useEffect, useMemo, useState } from 'react'

import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { Result, useSingleContractMultipleData } from 'state/multicall/hooks'
import { usePoolBlocks } from 'state/prommPools/hooks'

import { useProAmmTickReader } from './useContract'
import useProAmmPoolInfo from './useProAmmPoolInfo'

// use this to prevent filter tick 0
const isNullOrUndefinedOrEmptyString = <T>(value: T) => value === null || value === undefined || value === ''

export default function useProAmmPreviousTicks(
  pool: Pool | null | undefined,
  position: Position | undefined,
): number[] | undefined {
  const tickReader = useProAmmTickReader()

  const poolAddress = useProAmmPoolInfo(position?.pool.token0, position?.pool.token1, position?.pool.fee)
  const results = useSingleContractMultipleData(
    tickReader,
    'getNearestInitializedTicks',
    [
      [poolAddress, position?.tickLower],
      [poolAddress, position?.tickUpper],
    ].filter(item => !!pool && !isNullOrUndefinedOrEmptyString(item[0]) && !isNullOrUndefinedOrEmptyString(item[1])),
  )
  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])
  return useMemo(() => {
    if (!pool) return [TickMath.MIN_TICK, TickMath.MIN_TICK]
    if (!loading && !error && !!pool) {
      return results.map(call => {
        const result = call.result as Result
        return result.previous
      })
    }
    return undefined
  }, [results, loading, error, pool])
}
export function useProAmmMultiplePreviousTicks(
  pool: Pool | null | undefined,
  positions: (Position | undefined)[],
): number[][] | undefined {
  const tickReader = useProAmmTickReader()

  const poolAddress = useProAmmPoolInfo(
    positions?.[0]?.pool.token0,
    positions?.[0]?.pool.token1,
    positions?.[0]?.pool.fee,
  )

  const results = useSingleContractMultipleData(
    tickReader,
    'getNearestInitializedTicks',
    positions
      .map(position =>
        [
          [poolAddress, position?.tickLower],
          [poolAddress, position?.tickUpper],
        ].filter(
          item => !!pool && !isNullOrUndefinedOrEmptyString(item[0]) && !isNullOrUndefinedOrEmptyString(item[1]),
        ),
      )
      .flat()
      .filter(i => i?.length),
  )
  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])
  return useMemo(() => {
    if (!pool) return [[TickMath.MIN_TICK, TickMath.MIN_TICK]]
    if (!loading && !error && !!pool) {
      const result = results.map((call, index) => {
        const result = call.result as Result
        return result.previous
      })
      return positions.map((_, index) => [result[2 * index], result[2 * index + 1]])
    }
    return undefined
  }, [pool, loading, error, results, positions])
}

export function useProAmmTotalFeeOwedByPosition(pool: Pool | null | undefined, tokenID: string | undefined) {
  const tickReader = useProAmmTickReader()
  const poolAddress = useProAmmPoolInfo(pool?.token0, pool?.token1, pool?.fee)
  const { chainId } = useActiveWeb3React()
  const { blockLast24h } = usePoolBlocks()

  const [currentRes, setCurrentRes] = useState(['0', '0'])
  const [last24hRes, setLast24hRes] = useState(['0', '0'])

  useEffect(() => {
    if (isEVM(chainId)) {
      if (blockLast24h)
        tickReader
          ?.getTotalFeesOwedToPosition(
            NETWORKS_INFO[chainId].elastic.nonfungiblePositionManager,
            poolAddress,
            tokenID,
            {
              blockTag: Number(blockLast24h),
            },
          )
          .then((res: { token0Owed: BigNumber; token1Owed: BigNumber }) =>
            setLast24hRes([res.token0Owed.toString(), res.token1Owed.toString()]),
          )
          .catch((e: any) => {
            console.debug('Failed to get last 24h data, maybe position is just created', e)
          })
    }
  }, [blockLast24h, chainId, poolAddress, tokenID, tickReader])
  useEffect(() => {
    if (isEVM(chainId)) {
      tickReader
        ?.getTotalFeesOwedToPosition(
          NETWORKS_INFO[chainId].elastic.nonfungiblePositionManager,
          poolAddress,
          tokenID,
          {},
        )
        .then((res: { token0Owed: BigNumber; token1Owed: BigNumber }) => {
          setCurrentRes([res.token0Owed.toString(), res.token1Owed.toString()])
        })
    }
  }, [chainId, poolAddress, tickReader, tokenID])

  return { current: currentRes, last24h: last24hRes }
}
