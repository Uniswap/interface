import { useCallback } from 'react'
import { fetchQuery, GraphQLTaggedNode, useRelayEnvironment } from 'react-relay'
import { OperationType } from 'relay-runtime'

export function useRefreshableQuery<T extends OperationType>(
  query: GraphQLTaggedNode,
  variables: T['variables'],
  setData: (d: T['response']) => void,
  setError: (e: any) => void,
  setIsLoading: (loading: boolean) => void
) {
  const environment = useRelayEnvironment()

  const refreshData = useCallback(() => {
    fetchQuery<T>(environment, query, variables).subscribe({
      next: setData,
      error: setError,
      complete: () => setIsLoading(false),
    })
  }, [variables, environment, query, setData, setError, setIsLoading])

  return refreshData
}
