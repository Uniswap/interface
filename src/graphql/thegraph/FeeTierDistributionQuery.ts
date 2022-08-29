import graphql from 'babel-plugin-relay/macro'
import useInterval from 'lib/hooks/useInterval'
import { useCallback, useEffect, useState } from 'react'
import { fetchQuery } from 'react-relay'
import { useAppSelector } from 'state/hooks'

import type {
  FeeTierDistributionQuery as FeeTierDistributionQueryType,
  FeeTierDistributionQuery$data,
} from './__generated__/FeeTierDistributionQuery.graphql'
import environment from './RelayEnvironment'

const query = graphql`
  query FeeTierDistributionQuery($token0: String!, $token1: String!) {
    _meta {
      block {
        number
      }
    }
    asToken0: pools(
      orderBy: totalValueLockedToken0
      orderDirection: desc
      where: { token0: $token0, token1: $token1 }
    ) {
      feeTier
      totalValueLockedToken0
      totalValueLockedToken1
    }
    asToken1: pools(
      orderBy: totalValueLockedToken0
      orderDirection: desc
      where: { token0: $token1, token1: $token0 }
    ) {
      feeTier
      totalValueLockedToken0
      totalValueLockedToken1
    }
  }
`

export default function useFeeTierDistributionQuery(
  token0: string | undefined,
  token1: string | undefined,
  interval: number
) {
  const [data, setData] = useState<FeeTierDistributionQuery$data | null>(null)
  const [error, setError] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const chainId = useAppSelector((state) => state.application.chainId)

  const refreshData = useCallback(() => {
    if (token0 && token1 && chainId) {
      fetchQuery<FeeTierDistributionQueryType>(environment, query, {
        token0: token0.toLowerCase(),
        token1: token1.toLowerCase(),
      }).subscribe({
        next: setData,
        error: setError,
        complete: () => setIsLoading(false),
      })
    }
  }, [token0, token1, chainId])

  // Trigger fetch on first load
  useEffect(refreshData, [refreshData, token0, token1])

  useInterval(refreshData, interval, true)
  return { error, isLoading, data }
}
