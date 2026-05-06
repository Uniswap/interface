import { defaultShouldDehydrateQuery } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { isDevEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { jsonStringify } from 'utilities/src/serialization/json'

export const sharedDehydrateOptions: React.ComponentProps<
  typeof PersistQueryClientProvider
>['persistOptions']['dehydrateOptions'] = {
  shouldDehydrateQuery: (query) => {
    if (query.gcTime === 0) {
      return false
    }

    // Allowlist: only queries explicitly tagged via `persistableQueryOptions`
    // (which sets `meta.persist: true`) survive a page refresh. Anything else
    // — permissions, dialog state, trade quotes, gas estimates, anything
    // returning non-serializable data — is excluded by default.
    if (query.meta?.['persist'] !== true) {
      return false
    }

    if (!defaultShouldDehydrateQuery(query)) {
      return false
    }

    // Dev-only safety net: probe-serialize the query result using the SAME
    // serializer the persister uses (`jsonStringify`, which understands
    // BigInt via the `__bigint__:` prefix). Catches shapes that claimed to
    // be persistable but actually contain circular references, functions,
    // or other non-serializable data — anything that would silently fail
    // at persister time.
    if (isDevEnv() && query.state.data !== undefined) {
      try {
        jsonStringify(query.state.data)
      } catch (err) {
        logger.warn(
          'sharedDehydrateOptions',
          'shouldDehydrateQuery',
          `Query tagged meta.persist=true but data is not JSON-serializable; skipping persistence. queryKey[0]=${String(query.queryKey[0] ?? '')}`,
          { err, queryKey: query.queryKey },
        )
        return false
      }
    }

    return true
  },
}
