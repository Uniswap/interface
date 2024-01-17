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
import { GqlResult } from 'wallet/src/features/dataApi/types'
import { ROUTING_API_PATH } from 'wallet/src/features/routing/api'

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
        'variables' | 'fetchPolicy'
      > & {
        ttlMs: number
      })
    | (Omit<QueryHookOptions<{ data: TData }, { input: TVariables }>, 'variables'> & {
        fetchPolicy: 'no-cache'
        ttlMs?: undefined
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

  const queryResult = useQuery(document, queryOptions)

  // timestamp is injected by our `InMemoryCache` config (cache.ts)
  const lastFetchedTimestamp = (queryResult.data?.data as undefined | { timestamp: number })
    ?.timestamp
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
