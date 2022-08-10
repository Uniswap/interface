import graphql from 'babel-plugin-relay/macro'
// import { useEffect } from 'react'
// import { loadQuery, usePreloadedQuery, useQueryLoader } from 'react-relay'
import { useQuery } from 'relay-hooks'

import type { useAllV3TicksQuery } from './__generated__/useAllV3TicksQuery.graphql'
//import RelayEnvironment from '../RelayEnvironment'

const testQuery = graphql`
  query useAllV3TicksQuery($poolAddress: String!, $skip: Int!) {
    ticks(first: 1000, skip: $skip, where: { poolAddress: $poolAddress }, orderBy: tickIdx) {
      tick: tickIdx
      liquidityNet
      price0
      price1
    }
  }
`

export default function useAllV3TicksQuery2(poolAddress: string | undefined, skip: number) {
  const data = useQuery<useAllV3TicksQuery>(testQuery, { poolAddress: poolAddress ?? '', skip })
  return data
}
