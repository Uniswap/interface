import graphql from 'babel-plugin-relay/macro'
// import { useEffect } from 'react'
// import { loadQuery, usePreloadedQuery, useQueryLoader } from 'react-relay'
import { useQuery } from 'relay-hooks'

import type { useAllV3TicksQuery as UseAllV3TicksQueryType } from './__generated__/useAllV3TicksQuery.graphql'
//import RelayEnvironment from '../RelayEnvironment'

const query = graphql`
  query useAllV3TicksQuery($poolAddress: String!, $skip: Int!) {
    ticks(first: 1000, skip: $skip, where: { poolAddress: $poolAddress }, orderBy: tickIdx) {
      tick: tickIdx
      liquidityNet
      price0
      price1
    }
  }
`

export default function useAllV3TicksQuery(poolAddress: string | undefined, skip: number) {
  const data = useQuery<UseAllV3TicksQueryType>(query, {
    poolAddress: poolAddress ? poolAddress.toLowerCase() : '',
    skip,
  })
  return data
}
