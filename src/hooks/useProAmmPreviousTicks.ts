import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Pool, Position, TickMath } from '@kyberswap/ks-sdk-elastic'
import { BigNumber } from 'ethers'
import { useEffect, useMemo, useState } from 'react'

import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { Result, useSingleContractMultipleData } from 'state/multicall/hooks'
import { unwrappedToken } from 'utils/wrappedCurrency'

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

export function useTotalFeeOwedByElasticPosition(
  pool: Pool | null | undefined,
  tokenID: string | undefined,
  asWETH = false,
) {
  const tickReader = useProAmmTickReader()
  const poolAddress = useProAmmPoolInfo(pool?.token0, pool?.token1, pool?.fee)
  const { chainId } = useActiveWeb3React()

  const [fee, setFee] = useState<[string | undefined, string | undefined]>([undefined, undefined])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let i: number
    if (isEVM(chainId)) {
      const getFee = () => {
        setLoading(true)
        tickReader
          ?.getTotalFeesOwedToPosition(NETWORKS_INFO[chainId].elastic.nonfungiblePositionManager, poolAddress, tokenID)
          .then((res: { token0Owed: BigNumber; token1Owed: BigNumber }) => {
            setFee([res.token0Owed.toString(), res.token1Owed.toString()])
          })
          .finally(() => setLoading(false))
      }

      getFee()
      i = window.setInterval(() => getFee(), 6_969)
    }

    return () => {
      i && clearInterval(i)
    }
  }, [chainId, poolAddress, tickReader, tokenID])

  return {
    feeOwed:
      pool && fee[0] && fee[1]
        ? [
            CurrencyAmount.fromRawAmount(asWETH ? pool.token0 : unwrappedToken(pool.token0), fee[0]),
            CurrencyAmount.fromRawAmount(asWETH ? pool.token1 : unwrappedToken(pool.token1), fee[1]),
          ]
        : [undefined, undefined],
    loading,
  }
}
