import graphql from 'babel-plugin-relay/macro'
import useInterval from 'lib/hooks/useInterval'
import { useCallback, useEffect, useState } from 'react'
import { fetchQuery, useRelayEnvironment } from 'relay-hooks'
import { useAppSelector } from 'state/hooks'

import type {
  FeeTierDistributionQuery as FeeTierDistributionQueryType,
  FeeTierDistributionQuery$data,
} from './__generated__/FeeTierDistributionQuery.graphql'

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

type FeeTierDistribitionData = { error: any | null; isLoading: boolean; data: FeeTierDistributionQuery$data | null }

export default function useFeeTierDistributionQuery(
  token0: string | undefined,
  token1: string | undefined,
  interval: number
) {
  const [data, setData] = useState<FeeTierDistribitionData>({ error: null, isLoading: true, data: null })
  const environment = useRelayEnvironment()
  const chainId = useAppSelector((state) => state.application.chainId)

  const refreshData = () => {
    if (token0 && token1 && chainId) {
      fetchQuery<FeeTierDistributionQueryType>(environment, query, {
        token0: token0.toLowerCase(),
        token1: token1.toLowerCase(),
      }).subscribe({
        next: (data) => setData({ error: null, isLoading: false, data }),
        error: (error: any) => setData({ error, isLoading: false, data: null }),
      })
    }
  }

  useEffect(refreshData, [refreshData, token0, token1])

  useInterval(
    () => {
      refreshData()
    },
    interval,
    true
  )
  return data
}
