import { QueryClient } from '@tanstack/react-query'
import { FetchError } from '@universe/api/src/clients/base/errors'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { ONE_DAY_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

export const SharedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Ideally, these default values should never be used.
      // Each query should set its own `staleTime` and `gcTime` depending on how often the data is expected to change,
      // and how important it is to keep the data fresh every time a component mounts.
      staleTime: 15 * ONE_SECOND_MS,
      gcTime: ONE_DAY_MS,
      // Retry once, only if the error is a 500 fetch error.
      retry: (failureCount, error): boolean => {
        if (failureCount < 2 && error instanceof FetchError && error.response.status === 500) {
          return true
        }

        return false
      },
      queryKeyHashFn: hashKey,
    },
  },
})
