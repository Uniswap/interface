import { gql, OperationVariables, QueryHookOptions, useQuery } from '@apollo/client'
import { useMemo } from 'react'
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
  options?: Omit<QueryHookOptions<{ data: TData }, { input: TVariables }>, 'variables'>
): GqlResult<TData> {
  const document = gql`
    query Query($input: REST!) {
      data(input: $input) @rest(type: "${path}Response", path: "${path}", method: "POST") {
        ${fields.join('\n')}
      }
    }
  `
  const result = useQuery(document, { variables: { input: variables }, ...options })

  return useMemo(() => {
    const { data, ...rest } = result
    return {
      data: data?.data,
      ...rest,
    }
  }, [result])
}
