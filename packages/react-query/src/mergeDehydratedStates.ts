import type { DehydratedState } from '@tanstack/react-query'

/**
 * Merge multiple DehydratedState objects into one.
 * Deduplicates queries by queryHash, mutations by stringified key.
 *
 * Used in SSR: nested routes each prefetch in their loaders,
 * root merges all states into a single HydrationBoundary.
 */
export function mergeDehydratedStates(states: (DehydratedState | undefined | null)[]): DehydratedState {
  const validStates = states.filter((s): s is DehydratedState => s != null)

  const queriesMap = new Map<string, DehydratedState['queries'][number]>()
  const mutationsMap = new Map<string, DehydratedState['mutations'][number]>()

  for (const state of validStates) {
    for (const query of state.queries) {
      queriesMap.set(query.queryHash, query)
    }
    for (const mutation of state.mutations) {
      const key = mutation.mutationKey ? JSON.stringify(mutation.mutationKey) : `mutation-${mutationsMap.size}`
      mutationsMap.set(key, mutation)
    }
  }

  return {
    queries: Array.from(queriesMap.values()),
    mutations: Array.from(mutationsMap.values()),
  }
}
