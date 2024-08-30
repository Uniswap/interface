import { QueryClient } from '@tanstack/react-query'
import { ONE_DAY_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

export const SharedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Ideally, these default values should never be used.
      // Each query should set its own `staleTime` and `gcTime` depending on how often the data is expected to change,
      // and how important it is to keep the data fresh every time a component mounts.
      staleTime: 15 * ONE_SECOND_MS,
      gcTime: ONE_DAY_MS,
    },
  },
})
