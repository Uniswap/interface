import { ApolloError, useQuery } from '@apollo/client'
import { useMemo } from 'react'
import { FeeTierDistributionDocument, FeeTierDistributionQuery } from './__generated__/types-and-hooks'
import { apolloClient } from './apollo'

export default function useFeeTierDistributionQuery(
  token0: string | undefined,
  token1: string | undefined,
  interval: number
): { error?: ApolloError; isLoading: boolean; data: FeeTierDistributionQuery } {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(FeeTierDistributionDocument, {
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
