import { ApolloError, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { FeeTierDistributionQuery } from './__generated__/types-and-hooks'
import { apolloClient } from './apollo'

const query = gql`
  query FeeTierDistribution($token0: String!, $token1: String!) {
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
): { error: ApolloError | undefined; isLoading: boolean; data: FeeTierDistributionQuery } {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: {
      token0: token0?.toLowerCase(),
      token1: token1?.toLowerCase(),
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
