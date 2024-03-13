import { QueryResult } from '@apollo/client'

// Query result does not have a refetch property so add it here in case it needs to get returned
export type GqlResult<T> = Pick<QueryResult<T>, 'data' | 'loading' | 'error'> &
  Partial<Pick<QueryResult<T>, 'networkStatus'>> & {
    refetch?: () => void // TODO: [MOB-222] figure out the proper type for this from a QueryResult
  }
