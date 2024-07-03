import { Currency, Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { chainIdToBackendChain } from 'constants/chains'
import { PoolState, usePool } from 'hooks/usePools'
import ms from 'ms'
import { useMemo } from 'react'
import {
  useFeeTierDistributionQuery,
  useIsV3SubgraphStaleQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { logger } from 'utilities/src/logger/logger'

interface FeeTierDistribution {
  isLoading: boolean
  isError: boolean
  largestUsageFeeTier?: FeeAmount

  // distributions as percentages of overall liquidity
  distributions?: Record<FeeAmount, number | undefined>
}

export function useFeeTierDistribution(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
): FeeTierDistribution {
  const { isLoading, error, distributions } = usePoolTVL(currencyA?.wrapped, currencyB?.wrapped)

  // fetch all pool states to determine pool state
  const [poolStateVeryLow] = usePool(currencyA, currencyB, FeeAmount.LOWEST)
  const [poolStateLow] = usePool(currencyA, currencyB, FeeAmount.LOW)
  const [poolStateMedium] = usePool(currencyA, currencyB, FeeAmount.MEDIUM)
  const [poolStateHigh] = usePool(currencyA, currencyB, FeeAmount.HIGH)

  return useMemo(() => {
    if (isLoading || error || !distributions) {
      return {
        isLoading,
        isError: !!error,
        distributions,
      }
    }

    const largestUsageFeeTier = Object.keys(distributions)
      .map((d) => Number(d))
      .filter((d: FeeAmount) => distributions[d] !== 0 && distributions[d] !== undefined)
      .reduce((a: FeeAmount, b: FeeAmount) => ((distributions[a] ?? 0) > (distributions[b] ?? 0) ? a : b), -1)

    const percentages =
      !isLoading &&
      !error &&
      distributions &&
      poolStateVeryLow !== PoolState.LOADING &&
      poolStateLow !== PoolState.LOADING &&
      poolStateMedium !== PoolState.LOADING &&
      poolStateHigh !== PoolState.LOADING
        ? {
            [FeeAmount.LOWEST]:
              poolStateVeryLow === PoolState.EXISTS ? (distributions[FeeAmount.LOWEST] ?? 0) * 100 : undefined,
            [FeeAmount.LOW]: poolStateLow === PoolState.EXISTS ? (distributions[FeeAmount.LOW] ?? 0) * 100 : undefined,
            [FeeAmount.MEDIUM]:
              poolStateMedium === PoolState.EXISTS ? (distributions[FeeAmount.MEDIUM] ?? 0) * 100 : undefined,
            [FeeAmount.HIGH]:
              poolStateHigh === PoolState.EXISTS ? (distributions[FeeAmount.HIGH] ?? 0) * 100 : undefined,
          }
        : undefined

    return {
      isLoading,
      isError: !!error,
      distributions: percentages,
      largestUsageFeeTier: largestUsageFeeTier === -1 ? undefined : largestUsageFeeTier,
    }
  }, [isLoading, error, distributions, poolStateVeryLow, poolStateLow, poolStateMedium, poolStateHigh])
}

function usePoolTVL(token0: Token | undefined, token1: Token | undefined) {
  const chain = chainIdToBackendChain({ chainId: token0?.chainId, withFallback: true })
  const { loading, error, data } = useFeeTierDistributionQuery({
    variables: {
      chain,
      token0: token0?.address ?? '',
      token1: token1?.address ?? '',
    },
    pollInterval: ms(`30s`),
  })

  const { data: isSubgraphStaleData, error: isSubgraphStaleError } = useIsV3SubgraphStaleQuery({
    variables: { chain },
    pollInterval: ms(`30s`),
  })

  const { v3PoolsForTokenPair } = data ?? {}

  return useMemo(() => {
    if (isSubgraphStaleError || !v3PoolsForTokenPair) {
      return {
        isLoading: loading,
        error: error ?? isSubgraphStaleError,
      }
    }

    if (isSubgraphStaleData?.isV3SubgraphStale) {
      logger.info('useFeeTierDistribution', 'usePoolTVL', `Subgraph stale`)
      return {
        isLoading: loading,
        error,
      }
    }

    // sum tvl for token0 and token1 by fee tier
    const tvlByFeeTier = v3PoolsForTokenPair.reduce<{ [feeAmount: number]: [number | undefined, number | undefined] }>(
      (acc, value) => {
        if (!value.feeTier) {
          return acc
        }
        acc[value.feeTier][0] = (acc[value.feeTier][0] ?? 0) + Number(value.token0Supply)
        acc[value.feeTier][1] = (acc[value.feeTier][1] ?? 0) + Number(value.token1Supply)
        return acc
      },
      {
        [FeeAmount.LOWEST]: [undefined, undefined],
        [FeeAmount.LOW]: [undefined, undefined],
        [FeeAmount.MEDIUM]: [undefined, undefined],
        [FeeAmount.HIGH]: [undefined, undefined],
      } as Record<FeeAmount, [number | undefined, number | undefined]>,
    )

    // sum total tvl for token0 and token1
    const [sumToken0Tvl, sumToken1Tvl] = Object.values(tvlByFeeTier).reduce(
      (acc: [number, number], value) => {
        acc[0] += value[0] ?? 0
        acc[1] += value[1] ?? 0
        return acc
      },
      [0, 0],
    )

    // returns undefined if both tvl0 and tvl1 are undefined (pool not created)
    const mean = (tvl0: number | undefined, sumTvl0: number, tvl1: number | undefined, sumTvl1: number) =>
      tvl0 === undefined && tvl1 === undefined ? undefined : ((tvl0 ?? 0) + (tvl1 ?? 0)) / (sumTvl0 + sumTvl1) || 0

    const distributions: Record<FeeAmount, number | undefined> = {
      [FeeAmount.LOWEST]: mean(
        tvlByFeeTier[FeeAmount.LOWEST][0],
        sumToken0Tvl,
        tvlByFeeTier[FeeAmount.LOWEST][1],
        sumToken1Tvl,
      ),
      [FeeAmount.LOW]: mean(tvlByFeeTier[FeeAmount.LOW][0], sumToken0Tvl, tvlByFeeTier[FeeAmount.LOW][1], sumToken1Tvl),
      [FeeAmount.MEDIUM]: mean(
        tvlByFeeTier[FeeAmount.MEDIUM][0],
        sumToken0Tvl,
        tvlByFeeTier[FeeAmount.MEDIUM][1],
        sumToken1Tvl,
      ),
      [FeeAmount.HIGH]: mean(
        tvlByFeeTier[FeeAmount.HIGH][0],
        sumToken0Tvl,
        tvlByFeeTier[FeeAmount.HIGH][1],
        sumToken1Tvl,
      ),
    }

    return {
      isLoading: loading,
      error,
      distributions,
    }
  }, [isSubgraphStaleError, v3PoolsForTokenPair, isSubgraphStaleData?.isV3SubgraphStale, loading, error])
}
