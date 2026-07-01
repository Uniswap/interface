import { isMessage } from '@bufbuild/protobuf'
import { defaultShouldDehydrateQuery } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { isDevEnv, isTestEnv } from '@universe/environment'
import { logger } from 'utilities/src/logger/logger'
import { jsonStringify } from 'utilities/src/serialization/json'

const MAX_PROTOBUF_SCAN_DEPTH = 8

// Walks query data for a raw protobuf-es Message. `JSON.stringify` invokes a
// Message's `toJSON()` (wire format: oneof flattens, enums stringify), so a
// persisted Message restores as unparseable data. queryFns must convert via
// `toPlainMessage(...)` before returning. Returns the offending typeName if found.
// NB: a `bytes` field (Uint8Array) still won't round-trip even after toPlainMessage.
function findRawProtobufTypeName(value: unknown): string | undefined {
  const seen = new WeakSet<object>()
  function scan(val: unknown, depth: number): string | undefined {
    if (val === null || typeof val !== 'object') {
      return undefined
    }
    if (isMessage(val)) {
      return val.getType().typeName
    }
    if (depth >= MAX_PROTOBUF_SCAN_DEPTH || seen.has(val)) {
      return undefined
    }
    seen.add(val)
    const entries = Array.isArray(val) ? val : Object.values(val)
    for (const entry of entries) {
      const found = scan(entry, depth + 1)
      if (found) {
        return found
      }
    }
    return undefined
  }
  return scan(value, 0)
}

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
    if ((isDevEnv() || isTestEnv()) && query.state.data !== undefined) {
      // Tripwire: a raw protobuf Message would persist in wire format and
      // restore unparseable. Loud error tells the dev to wrap the queryFn
      // result in `toPlainMessage(...)`; skip persistence so the broken
      // value never reaches disk.
      const rawProtobufTypeName = findRawProtobufTypeName(query.state.data)
      if (rawProtobufTypeName) {
        logger.error(
          new Error(
            `Persisted query returns a raw protobuf Message '${rawProtobufTypeName}'; wrap its queryFn result in toPlainMessage(...). queryKey[0]=${String(query.queryKey[0] ?? '')}`,
          ),
          {
            tags: { file: 'sharedDehydrateOptions', function: 'shouldDehydrateQuery' },
            extra: { queryKey: query.queryKey },
          },
        )
        return false
      }

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
