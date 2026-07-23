import dotenv from 'dotenv'
import { escapeValue } from './format/format'

export interface DevEnvReconcileResult {
  /** Updated file content, with comments, ordering, and unlisted keys preserved. */
  content: string
  /** Keys whose values actually changed. */
  updatedKeys: string[]
}

// A `KEY=value` assignment line. Comment (`#…`) and blank lines don't match and are preserved.
const ASSIGNMENT_LINE = /^([A-Za-z_][A-Za-z0-9_]*)=/

/**
 * Reconcile a checked-in `.env.dev` file against freshly fetched config values.
 *
 * Only the *values of keys that already exist* in the file are updated, and only when they
 * actually changed. Comments, blank lines, key ordering, and any keys absent from the fetched
 * config are preserved verbatim. Keys present only in the fetched config are NOT added — the set
 * of keys in a checked-in `.env.dev` is intentionally curated.
 */
export function reconcileDevEnv(existingContent: string, fetchedValues: Record<string, string>): DevEnvReconcileResult {
  const existingValues = dotenv.parse(existingContent)
  const updatedKeys: string[] = []

  const content = existingContent
    .split('\n')
    .map((line) => {
      const key = ASSIGNMENT_LINE.exec(line)?.[1]
      if (key === undefined || !(key in fetchedValues)) {
        // Comment, blank line, or a key not managed by the config service: leave untouched.
        return line
      }
      const fetched = fetchedValues[key] ?? ''
      if (existingValues[key] === fetched) {
        // Value unchanged: preserve the original line's formatting.
        return line
      }
      updatedKeys.push(key)
      return `${key}=${escapeValue(fetched)}`
    })
    .join('\n')

  return { content, updatedKeys }
}
