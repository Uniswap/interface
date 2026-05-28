import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Flex } from 'ui/src'

type UnsubscribeFunction = () => void

type AdaptiveRefetchContext<T> = {
  query: T
  /** Forces the query to refetch even when no components are subscribed to it. */
  refetch: () => void
  /** Forces the query to update while this component is mounted. The returned UnsubscribeFunction must be called on unmount. */
  subscribe: () => UnsubscribeFunction
}

type AdaptiveRefetchProviderProps<T> = PropsWithChildren<{ fetch: () => void; query: T; stale: boolean }>

/** Used to create Context-based Providers and hooks for graphql queries that need state-based refetching not supported by Apollo's builtin cache-policies. */
export function createAdaptiveRefetchContext<T>() {
  const Context = createContext<AdaptiveRefetchContext<T> | undefined>(undefined)

  /** Handles refetching of the query based on staleness and whether or not components are watching the query. */
  function Provider({ children, fetch, query, stale }: AdaptiveRefetchProviderProps<T>) {
    // Tracks the number of components currently watching the query; If 0, a stale query will not be re-fetched.
    const [numSubscribers, setNumSubscribers] = useState(0)

    // Tracks whether or not the current query data is undefined or out of date to avoid unnecessary re-fetches.
    const [isStale, setIsStale] = useState(true)
    useEffect(() => {
      if (stale) {
        setIsStale(true)
      }
    }, [stale])

    // Fetches balances when the query is both stale and subscribed to.
    useEffect(() => {
      if (isStale && numSubscribers) {
        fetch()
        setIsStale(false)
      }
    }, [numSubscribers, fetch, isStale])

    const subscribe = useCallback(() => {
      setNumSubscribers((prev) => prev + 1)
      return () => setNumSubscribers((prev) => prev - 1)
    }, [])

    const refetch = useCallback(() => {
      if (!isStale) {
        return
      }
      fetch()
      setIsStale(false)
    }, [fetch, isStale])

    return (
      <Context.Provider
        value={useMemo(
          () => ({
            query,
            refetch,
            subscribe,
          }),
          [refetch, query, subscribe],
        )}
      >
        {children}
      </Context.Provider>
    )
  }

  /**
   * Returns the query from an AdaptiveRefetchContext, and handles subscribing/unsubscribing to the query on mount/unmount.
   * @param options.cacheOnly - If true, this hook will only return cached data and not trigger fetches.
   */
  function useQuery(options?: { cacheOnly?: boolean }) {
    const context = useContext(Context)
    if (!context) {
      throw new Error('useAdaptiveRefetchQuery must be used within an AdaptiveRefetchProvider')
    }
    const { subscribe } = context

    // Subscribing/unsubscribing allows AdaptiveRefetchProvider to track whether components are currently using the query or not, impacting whether or not to re-fetch when stale.
    useEffect(() => {
      if (options?.cacheOnly === true) {
        return undefined
      }
      return subscribe()
    }, [options?.cacheOnly, subscribe])

    return context.query
  }

  /** Fetches the query upon hover, even if no `useQuery` hooks are subscribed. */
  function PrefetchWrapper({ children, className }: PropsWithChildren<{ className?: string }>) {
    const contextValue = useContext(Context)
    if (!contextValue) {
      throw new Error('PrefetchWrapper must be used within an AdaptiveRefetchProvider')
    }
    const { refetch } = contextValue

    return (
      <Flex className={className} onMouseEnter={refetch}>
        {children}
      </Flex>
    )
  }

  return { Provider, PrefetchWrapper, useQuery }
}
