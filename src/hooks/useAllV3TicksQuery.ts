import graphql from 'babel-plugin-relay/macro'
import { useEffect } from 'react'
import { usePreloadedQuery, useQueryLoader } from 'react-relay'

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

function useAllV3TicksQuery(poolAddress: string, skip: number) {
  const [queryRef, loadQuery, disposeQuery] = useQueryLoader(testQuery)

  // Load immediately
  useEffect(() => {
    loadQuery({ count: 20 }, { fetchPolicy: 'store-or-network' })
  }, [loadQuery])
}
