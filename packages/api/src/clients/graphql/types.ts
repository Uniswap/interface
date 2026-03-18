import type { QueryResult } from '@apollo/client'
import type { ApolloError } from '@apollo/client/errors'

// Query result does not have a refetch property so add it here in case it needs to get returned
export type GqlResult<T> = Pick<QueryResult<T>, 'data' | 'loading'> &
  Partial<Pick<QueryResult<T>, 'networkStatus'>> & {
    refetch?: () => void // TODO: [MOB-222] figure out the proper type for this from a QueryResult
    error?: ApolloError | Error
  }
