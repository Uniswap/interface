import useInterval from 'lib/hooks/useInterval'
import { useCallback, useState } from 'react'
import { fetchQuery, GraphQLTaggedNode, useRelayEnvironment } from 'react-relay'
import { OperationType } from 'relay-runtime'

export function useDataQueryer<T extends OperationType>(query: GraphQLTaggedNode, variables: T['variables']) {
  const [data, setData] = useState<T['response'] | null>(null)
  const [error, setError] = useState<any>()
  const [isLoading, setIsLoading] = useState(true)
  const environment = useRelayEnvironment()

  const refreshData = useCallback(() => {
    if (variables) {
      fetchQuery<T>(environment, query, variables).subscribe({
        next: setData,
        error: setError,
        complete: () => setIsLoading(false),
      })
    } else {
      setIsLoading(false)
    }
  }, [variables, environment, query])

  return { refreshData, error, isLoading, data }
}

export default function useIntervalDataQuery<T extends OperationType>(
  query: GraphQLTaggedNode,
  variables: T['variables'],
  interval: number
) {
  const { refreshData, error, isLoading, data } = useDataQueryer<T>(query, variables)

  useInterval(refreshData, interval, true)
  return { error, isLoading, data }
}
