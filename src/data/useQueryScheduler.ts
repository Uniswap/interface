import { useEffect, useRef } from 'react'
import { InteractionManager } from 'react-native'
import { useQueryLoader } from 'react-relay'
import { GraphQLTaggedNode, OperationType } from 'relay-runtime'

type QueryOptions = Parameters<ReturnType<typeof useQueryLoader>[1]>['1']

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
  options: QueryOptions
) {
  const [queryReference, load] = useQueryLoader<Q>(query)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) {
      return
    }

    loaded.current = true
    register(priority, () => load(params, options))
  }, [load, options, params, priority])

  return { queryReference, load }
}

function register(priority: Priority, callback: () => any) {
  switch (priority) {
    case Priority.Idle:
      InteractionManager.runAfterInteractions(callback)
      break
    case Priority.Immediate:
      callback()
      break
    default:
      throw new Error('Unsupported priority' + priority)
  }
}
