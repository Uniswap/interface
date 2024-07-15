import {
  ApolloClient,
  FetchResult,
  gql,
  MutationHookOptions,
  MutationResult,
  NetworkStatus,
  OperationVariables,
  QueryHookOptions,
  useApolloClient,
  useMutation,
  useQuery,
} from '@apollo/client'
import { useEffect, useMemo } from 'react'
import { GqlResult } from 'uniswap/src/data/types'

/** Wrapper around Apollo client `useQuery` that calls REST APIs */
export function useRestQuery<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables
>(
  // Relative URL path of the endpoint
  path: string,
  // Variables required by the endpoint
  variables: TVariables,
  // Fields requested from the endpoint
  fields: string[],
  // When using `fetchPolicy: 'no-cache'`, you must omit `ttlMs`.
  options:
    | (Omit<
        QueryHookOptions<{ data: TData }, { input: TVariables }>,
        'variables' | 'fetchPolicy' | 'defaultOptions' | 'nextFetchPolicy'
      > & {
        ttlMs: number
        // By default, we return stale data while refetching even when `ttlMs` has passed.
        // To avoid returning stale data for time-sensitive responses (for example, swap quotes) set this to `true`.
        clearIfStale?: boolean
      })
    | (Omit<
        QueryHookOptions<{ data: TData }, { input: TVariables }>,
        'variables' | 'defaultOptions' | 'nextFetchPolicy'
      > & {
        fetchPolicy: 'no-cache'
        ttlMs?: undefined
        clearIfStale?: undefined
      }),
  method: 'GET' | 'POST' = 'POST',
  client?: ApolloClient<unknown>
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

  const queryResult = useQuery<{ data: TData }, { input: TVariables }>(document, queryOptions)

  // timestamp is injected by our `InMemoryCache` config (cache.ts)
  const lastFetchedTimestamp = (queryResult.data?.data as undefined | { timestamp: number })
    ?.timestamp
  const cacheExpired = getCacheExpired(lastFetchedTimestamp, options.ttlMs)

  // re-export query result with easier data access
  const result = useMemo(
    () => ({
      ...queryResult,
      data: cacheExpired && options.clearIfStale ? undefined : queryResult.data?.data,
    }),
    [queryResult, cacheExpired, options.clearIfStale]
  )

  useEffect(() => {
    // avoid triggering refetch when a request is in flight
    if (result.networkStatus !== NetworkStatus.ready) {
      return
    }

    if (cacheExpired) {
      result.refetch().catch(() => undefined)
    }
  }, [cacheExpired, result])

  return result
}

const getCacheExpired = (
  lastFetchedTimestamp: number | undefined,
  ttl: number | undefined
): boolean => {
  // if there is no timestamp, then it's the first ever query and there is no cache to expire
  if (!lastFetchedTimestamp) {
    return false
  }
  // if there's no ttl, we just use apollo's fetch-policy and we do not want to manually refetch
  if (ttl === undefined) {
    return false
  }

  return Date.now() - lastFetchedTimestamp > ttl
}

/**
 * Wrapper around Apollo client `useMutation` for making REST API calls.
 *
 * This function simplifies the process of executing RESTful operations such as POST, PUT, and DELETE
 * through GraphQL mutations. It constructs a GraphQL mutation that integrates with the Apollo Client's `@rest` directive.
 *
 * @param path - The relative URL path of the REST API endpoint.
 * @param fields - The fields to be returned in the response. These should match the structure of the expected REST API response.
 * @param method - The HTTP method ('POST', 'PUT', 'DELETE') for the REST API call.
 * @param options - Additional options for the mutation, excluding 'variables'.
 * @param client - An optional ApolloClient instance. If not provided, the default client will be used.
 * @returns A tuple where the first element is a simplified mutate function and the second element provides the mutation's status:
 *          - The mutate function directly accepts variables of type TVariables and handles the necessary structuring for the REST API call.
 *          - The status object includes fields such as 'data', 'loading', and 'error', providing information about the mutation execution.
 *
 * Example usage: `wallet/src/unitags/api.ts` and `mobile/src/feature/unitags/ChooseProfilePictureScreen.tsx`
 */
export function useRestMutation<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables
>(
  path: string,
  fields: string[],
  options: Omit<MutationHookOptions<{ data: TData }, { input: TVariables }>, 'variables'>,
  method: 'POST' | 'PUT' | 'DELETE',
  client?: ApolloClient<object>
): [(variables: TVariables) => Promise<FetchResult<{ data: TData }>>, MutationResult<TData>] {
  const document = gql`
    mutation Mutation($input: REST!) {
      data(input: $input) @rest(
        type: "${path}Response",
        path: "${path}",
        method: "${method}"
      ) {
        ${fields.join('\n')}
      }
    }
  `
  const defaultClient = useApolloClient()
  const mutationOptions: MutationHookOptions<{ data: TData }, { input: TVariables }> = {
    ...options,
    client: client ?? defaultClient,
  }
  const [mutateFunction, mutationResult] = useMutation<{ data: TData }, { input: TVariables }>(
    document,
    mutationOptions
  )

  // Wrapper for the mutate function to simplify its usage
  const wrappedMutateFunction = (variables: TVariables): ReturnType<typeof mutateFunction> => {
    return mutateFunction({ variables: { input: variables } })
  }

  // Unwrap the response data
  const modifiedMutationResult = {
    ...mutationResult,
    data: mutationResult.data ? mutationResult.data.data : null,
  }

  return [wrappedMutateFunction, modifiedMutationResult]
}
