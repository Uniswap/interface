import { createConsoleLogger, type Logger } from '@universe/logger'

let logger: Logger | undefined

/**
 * Dev-only guard: logs an error when keyExtractor produces duplicate keys, which
 * breaks recycling and causes relayout / height under-estimation (SWAP-2787).
 */
export function warnOnDuplicateKeys(keys: readonly string[]): void {
  logger ??= createConsoleLogger('UniversalList')
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const key of keys) {
    if (seen.has(key)) {
      duplicates.add(key)
    } else {
      seen.add(key)
    }
  }
  if (duplicates.size > 0) {
    logger.error(
      `keyExtractor produced duplicate keys (${[...duplicates].join(', ')}). Keys must be unique and stable.`,
    )
  }
}
