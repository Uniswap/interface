import graphql from 'babel-plugin-relay/macro'
import useInterval from 'lib/hooks/useInterval'
import { useCallback, useEffect, useState } from 'react'
import { fetchQuery } from 'react-relay'
import { useAppSelector } from 'state/hooks'

import type {
  AllV3TicksQuery as AllV3TicksQueryType,
  AllV3TicksQuery$data,
} from './__generated__/AllV3TicksQuery.graphql'
import environment from './RelayEnvironment'

const query = graphql`
  query AllV3TicksQuery($poolAddress: String!, $skip: Int!) {
    ticks(first: 1000, skip: $skip, where: { poolAddress: $poolAddress }, orderBy: tickIdx) {
      tick: tickIdx
      liquidityNet
      price0
      price1
    }
  }
`

export type Ticks = AllV3TicksQuery$data['ticks']
export type TickData = Ticks[number]

export default function useAllV3TicksQuery(poolAddress: string | undefined, skip: number, interval: number) {
  const [data, setData] = useState<AllV3TicksQuery$data | null>(null)
  const [error, setError] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const chainId = useAppSelector((state) => state.application.chainId)

  const refreshData = useCallback(() => {
    if (poolAddress && chainId) {
      fetchQuery<AllV3TicksQueryType>(environment, query, {
        poolAddress: poolAddress.toLowerCase(),
        skip,
      }).subscribe({
        next: setData,
        error: setError,
        complete: () => setIsLoading(false),
      })
    } else {
      setIsLoading(false)
    }
  }, [poolAddress, skip, chainId])

  // Trigger fetch on first load
  useEffect(refreshData, [refreshData, poolAddress, skip])

  useInterval(refreshData, interval, true)
  return { error, isLoading, data }
}
