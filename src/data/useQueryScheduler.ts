import { useEffect } from 'react'
import { InteractionManager } from 'react-native'
import { QueryOptionsOffline } from 'react-relay-offline'
import { GraphQLTaggedNode, OperationType } from 'relay-runtime'
import { useQueryLoader } from 'src/data/preloading'

export enum Priority {
  // Wait until there is no active work (as defined by InteractionManager)
  Idle = 'idle',
  // Run query as soon as possible
  Immediate = 'immediate',
}

export function useQueryScheduler<Q extends OperationType>(
  priority: Priority,
  query: GraphQLTaggedNode,
  params: Q['variables'],
  options: QueryOptionsOffline
) {
  const { preloadedQuery, load } = useQueryLoader<Q>(query)

  useEffect(() => {
    register(priority, () => load(params, options))
  }, [load, options, params, priority])

  return { preloadedQuery, load }
}

function register(priority: Priority, callback: () => any) {
  switch (priority) {
    case Priority.Immediate:
      callback()
      break
    case Priority.Idle:
      InteractionManager.runAfterInteractions(callback)
      break
    default:
      throw new Error('Unsupported priority' + priority)
  }
}
