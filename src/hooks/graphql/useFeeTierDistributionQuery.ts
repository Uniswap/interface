import graphql from 'babel-plugin-relay/macro'
import { useQuery } from 'relay-hooks'

import type { useFeeTierDistributionQuery as UseFeeTierDistributionQueryType } from './__generated__/useFeeTierDistributionQuery.graphql'

const query = graphql`
  query useFeeTierDistributionQuery($token0: String!, $token1: String!) {
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

export default function useFeeTierDistributionQuery(token0: string | undefined, token1: string | undefined) {
  const data = useQuery<UseFeeTierDistributionQueryType>(query, {
    token0: token0 ? token0.toLowerCase() : '',
    token1: token1 ? token1.toLowerCase() : '',
  })
  return data
}
