import { QueryResult } from '@apollo/client'
import { ApolloError } from '@apollo/client/errors'
// Query result does not have a refetch property so add it here in case it needs to get returned
export type GqlResult<T> = Pick<QueryResult<T>, 'data' | 'loading'> &
  Partial<Pick<QueryResult<T>, 'networkStatus'>> & {
    refetch?: () => void // TODO: [MOB-222] figure out the proper type for this from a QueryResult
    error?: ApolloError | Error
  }

export enum SpamCode {
  LOW = 0, // same as isSpam = false on TokenProject
  MEDIUM = 1, // same as isSpam = true on TokenProject
  HIGH = 2, // has a URL in token name
}
