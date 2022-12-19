import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { AllV3TicksQuery } from './__generated__/types-and-hooks'
import { apolloClient } from './apollo'

const query = gql`
  query AllV3Ticks($poolAddress: String!, $skip: Int!) {
    ticks(first: 1000, skip: $skip, where: { poolAddress: $poolAddress }, orderBy: tickIdx) {
      tick: tickIdx
      liquidityNet
      price0
      price1
    }
  }
`

export type Ticks = AllV3TicksQuery['ticks']
export type TickData = Ticks[number]

export default function useAllV3TicksQuery(poolAddress: string | undefined, skip: number, interval: number) {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: {
      poolAddress: poolAddress?.toLowerCase(),
      skip,
    },
    pollInterval: interval,
    client: apolloClient,
  })

  return useMemo(
    () => ({
      error,
      isLoading,
      data,
    }),
    [data, error, isLoading]
  )
}
