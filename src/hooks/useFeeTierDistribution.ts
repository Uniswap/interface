import { FeeAmount } from '@uniswap/v3-sdk'
import { Token } from '@uniswap/sdk-core'
import { usePoolsQuery } from 'state/data/generated'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { reduce } from 'lodash'
import { useBlockNumber } from 'state/application/hooks'
import ReactGA from 'react-ga'
import { useMemo } from 'react'

// maximum number of blocks past which we consider the data stale
const MAX_DATA_BLOCK_AGE = 10

export interface FeeTierDistribution {
  isLoading: boolean
  isError: boolean
  largestUsageFeeTier?: FeeAmount | undefined

  // distributions as percentages of overall liquidity
  distributions?: {
    [FeeAmount.LOW]: number | undefined
    [FeeAmount.MEDIUM]: number | undefined
    [FeeAmount.HIGH]: number | undefined
  }
}

export function useFeeTierDistribution(token0: Token | undefined, token1: Token | undefined): FeeTierDistribution {
  const { isFetching, isLoading, isUninitialized, isError, distributions } = usePoolTVL(token0, token1)

  return useMemo(() => {
    if (isLoading || isFetching || isUninitialized || isError || !distributions) {
      return {
        isLoading: isLoading || isFetching || !isUninitialized,
        isError,
      }
    }

    const largestUsageFeeTier = Object.keys(distributions)
      .map((d) => Number(d))
      .filter((d: FeeAmount) => distributions[d] !== 0 && distributions[d] !== undefined)
      .reduce((a: FeeAmount, b: FeeAmount) => ((distributions[a] ?? 0) > (distributions[b] ?? 0) ? a : b), -1)

    const percentages =
      !isLoading && !isError && distributions
        ? {
            [FeeAmount.LOW]: distributions[FeeAmount.LOW] ? (distributions[FeeAmount.LOW] ?? 0) * 100 : undefined,
            [FeeAmount.MEDIUM]: distributions[FeeAmount.MEDIUM]
              ? (distributions[FeeAmount.MEDIUM] ?? 0) * 100
              : undefined,
            [FeeAmount.HIGH]: distributions[FeeAmount.HIGH] ? (distributions[FeeAmount.HIGH] ?? 0) * 100 : undefined,
          }
        : undefined

    return {
      isLoading,
      isError,
      distributions: percentages,
      largestUsageFeeTier: largestUsageFeeTier === -1 ? undefined : largestUsageFeeTier,
    }
  }, [isLoading, isFetching, isUninitialized, isError, distributions])
}

function usePoolTVL(token0: Token | undefined, token1: Token | undefined) {
  const latestBlock = useBlockNumber()

  const { isLoading, isFetching, isUninitialized, isError, data } = usePoolsQuery(
    token0 && token1 ? { token0: token0.address.toLowerCase(), token1: token1.address.toLowerCase() } : skipToken,
    {
      pollingInterval: 60000, // 1 minute
    }
  )

  const { asToken0, asToken1, _meta } = data ?? {}

  return useMemo(() => {
    if (!latestBlock || !_meta || !asToken0 || !asToken1) {
      return {
        isLoading,
        isFetching,
        isUninitialized,
        isError,
      }
    }

    if (latestBlock - (_meta?.block?.number ?? 0) > MAX_DATA_BLOCK_AGE) {
      ReactGA.exception({
        description: `Graph stale (latest block: ${latestBlock})`,
      })

      return {
        isLoading,
        isFetching,
        isUninitialized,
        isError,
      }
    }

    const all = asToken0.concat(asToken1)

    // sum tvl for token0 and token1 by fee tier
    const tvlByFeeTer = all.reduce<{ [feeAmount: number]: [number | undefined, number | undefined] }>(
      (acc, value) => {
        acc[value.feeTier][0] = (acc[value.feeTier][0] ?? 0) + Number(value.totalValueLockedToken0)
        acc[value.feeTier][1] = (acc[value.feeTier][1] ?? 0) + Number(value.totalValueLockedToken1)
        return acc
      },
      {
        [FeeAmount.LOW]: [undefined, undefined],
        [FeeAmount.MEDIUM]: [undefined, undefined],
        [FeeAmount.HIGH]: [undefined, undefined],
      }
    )

    // sum total tvl for token0 and token1
    const [sumToken0Tvl, sumToken1Tvl] = reduce(
      tvlByFeeTer,
      (acc: [number, number], value) => {
        acc[0] += value[0] ?? 0
        acc[1] += value[1] ?? 0
        return acc
      },
      [0, 0]
    )

    // returns undefined if both tvl0 and tvl1 are undefined (pool not created)
    const mean = (tvl0: number | undefined, sumTvl0: number, tvl1: number | undefined, sumTvl1: number) =>
      tvl0 === undefined && tvl1 === undefined ? undefined : ((tvl0 ?? 0) + (tvl1 ?? 0)) / (sumTvl0 + sumTvl1) || 0

    return {
      isLoading,
      isFetching,
      isUninitialized,
      isError,
      distributions: {
        [FeeAmount.LOW]: mean(tvlByFeeTer[FeeAmount.LOW][0], sumToken0Tvl, tvlByFeeTer[FeeAmount.LOW][1], sumToken1Tvl),
        [FeeAmount.MEDIUM]: mean(
          tvlByFeeTer[FeeAmount.MEDIUM][0],
          sumToken0Tvl,
          tvlByFeeTer[FeeAmount.MEDIUM][1],
          sumToken1Tvl
        ),
        [FeeAmount.HIGH]: mean(
          tvlByFeeTer[FeeAmount.HIGH][0],
          sumToken0Tvl,
          tvlByFeeTer[FeeAmount.HIGH][1],
          sumToken1Tvl
        ),
      },
    }
  }, [_meta, asToken0, asToken1, isLoading, isError, isFetching, isUninitialized, latestBlock])
}
