import {
  ApolloClient,
  gql,
  NetworkStatus,
  OperationVariables,
  QueryHookOptions,
  useApolloClient,
  useQuery,
} from '@apollo/client'
import { useEffect, useMemo } from 'react'
import { GqlResult } from 'wallet/src/features/dataApi/types'
import { ROUTING_API_PATH } from 'wallet/src/features/routing/api'

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
  options: Omit<
    QueryHookOptions<{ data: TData }, { input: TVariables }>,
    'variables' | 'fetchPolicy'
  > & {
    ttlMs: number
  },
  method: 'GET' | 'POST' = 'POST',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client?: ApolloClient<any>
): GqlResult<TData> {
  const document = gql`
    query Query($input: REST!) {
      data(input: $input) @rest(type: "${path}Response", path: "${path}", method: "${method}") {
        ${fields.join('\n')}
          timestamp
      }
    }
  `

  const defaultClient = useApolloClient()

  const queryOptions: QueryHookOptions<{ data: TData }, { input: TVariables }> = {
    variables: { input: variables },
    fetchPolicy: 'cache-first',
    ...options,
    client: client ?? defaultClient,
  }

  const queryResult = useQuery(document, queryOptions)

  // @ts-expect-error timestamp is provided by useQuery
  const lastFetchedTimestamp: number | undefined = queryResult.data?.data?.timestamp
  const cacheExpired = getCacheExpired(lastFetchedTimestamp, options.ttlMs)

  // re-export query result with easier data access
  const result = useMemo(
    // clear old routing API results if beyond TTL to avoid submitting outdated quotes
    () => ({
      ...queryResult,
      data: cacheExpired && path === ROUTING_API_PATH ? undefined : queryResult.data?.data,
    }),
    [path, cacheExpired, queryResult]
  )

  useEffect(() => {
    // avoid triggering refetch when a request is in flight
    if (result.networkStatus !== NetworkStatus.ready) return

    if (cacheExpired) result.refetch().catch(() => undefined)
  }, [cacheExpired, result])

  return result
}

const getCacheExpired = (lastFetchedTimestamp: number | undefined, ttl: number): boolean => {
  // if there is no timestamp, then it's the first ever query and there is no cache to expire
  if (!lastFetchedTimestamp) return false

  return Date.now() - lastFetchedTimestamp > ttl
}
