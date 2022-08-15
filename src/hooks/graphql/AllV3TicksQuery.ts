import graphql from 'babel-plugin-relay/macro'
import useInterval from 'lib/hooks/useInterval'
import { useCallback, useEffect, useState } from 'react'
import { fetchQuery, useRelayEnvironment } from 'relay-hooks'
import { useAppSelector } from 'state/hooks'

import type {
  AllV3TicksQuery as AllV3TicksQueryType,
  AllV3TicksQuery$data,
} from './__generated__/AllV3TicksQuery.graphql'

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

type TickData = { error: any | null; isLoading: boolean; data: AllV3TicksQuery$data | null }

export default function useAllV3TicksQuery(poolAddress: string | undefined, skip: number, interval: number) {
  const [data, setData] = useState<TickData>({ error: null, isLoading: true, data: null })
  const chainId = useAppSelector((state) => state.application.chainId)
  const environment = useRelayEnvironment()

  const refreshData = useCallback(() => {
    if (poolAddress && chainId) {
      fetchQuery<AllV3TicksQueryType>(environment, query, {
        poolAddress: poolAddress ? poolAddress.toLowerCase() : '',
        skip,
      }).subscribe({
        next: (data) => setData({ error: null, isLoading: false, data }),
        error: (error: any) => setData({ error, isLoading: false, data: null }),
      })
    }
  }, [poolAddress, chainId, skip, environment])

  useEffect(refreshData, [refreshData, poolAddress, skip])

  useInterval(
    () => {
      refreshData()
    },
    interval,
    true
  )
  return data
}
