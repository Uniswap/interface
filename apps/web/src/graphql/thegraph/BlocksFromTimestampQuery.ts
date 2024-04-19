import { type ApolloError, useQuery } from '@apollo/client'
import { useMemo } from 'react'
import { type BlocksFromTimestampQuery, BlocksFromTimestampDocument } from './__generated__/types-and-hooks'
import { apolloClientBlock } from './apollo'

export default function useBlocksFromTimestamp(timestamp: number): {
  error?: ApolloError
  isLoading: boolean
  data: BlocksFromTimestampQuery
} {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(BlocksFromTimestampDocument, {
    variables: {
      timestamp: timestamp,
      timestampEnd: timestamp + 600,
    },
    client: apolloClientBlock,
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
