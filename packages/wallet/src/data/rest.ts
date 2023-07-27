import { gql, OperationVariables, QueryHookOptions, useQuery } from '@apollo/client'
import { useEffect, useMemo } from 'react'
import { GqlResult } from 'wallet/src/features/dataApi/types'

/** Wrapper around Apollo client `useQuery` that calls REST APIs */
export function useRestQuery<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  TVariables extends OperationVariables = OperationVariables
>(
  // Relative URL path of the endpoint
  path: string,
  // Variables required by the endpoint
  variables: TVariables,
  // Fields requested from the endpoint
  fields: string[],
  options?: Omit<QueryHookOptions<{ data: TData }, { input: TVariables }>, 'variables'> & {
    ttlMs?: number
  },
  method: 'GET' | 'POST' = 'POST'
): GqlResult<TData> {
  const document = useMemo(
    () =>
      gql`
    query Query($input: REST!) {
      data(input: $input) @rest(type: "${path}Response", path: "${path}", method: "${method}") {
        ${fields
          // always add `timestamp` to fields to invalidate (no dedupe required)
          .concat(options?.ttlMs ? 'timestamp' : [])
          .join('\n')}
      }
    }
  `,
    [fields, method, options?.ttlMs, path]
  )

  const queryOptions = useMemo(
    (): QueryHookOptions<{ data: TData }, { input: TVariables }> => ({
      variables: { input: variables },
      fetchPolicy: 'cache-first',
      ...options,
    }),
    [options, variables]
  )

  const queryResult = useQuery(document, queryOptions)

  // re-export query result with easier data access
  const result = useMemo(() => {
    const { data, ...rest } = queryResult
    return {
      data: data?.data,
      ...rest,
    }
  }, [queryResult])

  // invalidate old query results if beyond TTL
  useEffect(() => {
    // @ts-expect-error tiemstamp is provided by useQuery
    const lastFetchedTimestamp = result.data?.timestamp
    if (
      !lastFetchedTimestamp || // never fetched handled by `cache-first` policy
      !options?.ttlMs
    )
      return

    const age = Date.now() - lastFetchedTimestamp
    if (age > options?.ttlMs) {
      result.refetch().catch(() => undefined)
    }
  }, [options?.ttlMs, result])

  return result
}
