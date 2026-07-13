import type { ParameterEntry } from '@universe/api'

/**
 * Pure helpers for transforming Config Service parameter entries to dotenv-formatted output.
 *
 * Keys come from the backend as path-shaped strings like `/web/default/api-url`. The
 * trailing segment is what we surface as a human-readable name; for dotenv-style output
 * the same segment is kebab→UPPER_SNAKE-cased so it survives shell parsing.
 */

/** Trailing segment of a slash-delimited key. `'/web/default/api-url'` -> `'api-url'`. */
export function lastSegment(key: string): string {
  const idx = key.lastIndexOf('/')
  return idx === -1 ? key : key.slice(idx + 1)
}

/**
 * Render the parameter key as an env-var name: kebab-cased last segment converted to
 * UPPER_SNAKE_CASE. `'/web/default/app-id'` -> `'APP_ID'`.
 */
export function envName(key: string): string {
  return lastSegment(key).replaceAll('-', '_').toUpperCase()
}

/**
 * Web app env vars are read with optional `VITE_` / `REACT_APP_` prefixes (see
 * BaseConfig.ts), so a hand-written .env may carry either form. The Config Service
 * stores canonical (unprefixed) names — strip both before converting to a param name
 * so `pull → push` round-trips don't silently fork into a second key under the wrong
 * prefixed name.
 */
const STRIPPABLE_ENV_PREFIXES = ['VITE_', 'REACT_APP_'] as const

export function stripEnvPrefix(envVar: string): string {
  for (const prefix of STRIPPABLE_ENV_PREFIXES) {
    if (envVar.startsWith(prefix)) {
      return envVar.slice(prefix.length)
    }
  }
  return envVar
}

/**
 * Inverse of {@link envName}: convert an env-var-style name to a Config Service
 * parameter name. `'APP_ID'` -> `'app-id'`, `'VITE_APP_ID'` -> `'app-id'`. Used when
 * pushing local .env entries back into the service, which expects kebab-cased
 * lower-case names without web-framework prefixes.
 */
export function paramName(envVar: string): string {
  return stripEnvPrefix(envVar).replaceAll('_', '-').toLowerCase()
}

/**
 * Convert a list of Config Service parameter entries into a record keyed by env-var name.
 * Skips entries with no `key` (server returns them as missing fields rather than empty strings).
 */
export function paramEntryToObject(parameters: ParameterEntry[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const p of parameters) {
    if (!p.key) {
      continue
    }
    out[envName(p.key)] = p.value ?? ''
  }
  return out
}

/**
 * Serialize a record into a dotenv-formatted string. Each value is double-quoted with
 * backslashes, quotes, and newlines escaped so multi-line strings round-trip cleanly
 * through `dotenv.parse` on read.
 */
export function serializeParams(entries: Record<string, string>): string {
  const keys = Object.keys(entries)
  return keys.length === 0 ? '' : `${keys.map((k) => `${k}=${escapeValue(entries[k] ?? '')}`).join('\n')}\n`
}

/**
 * Wrap values in double quotes so multi-line strings round-trip through dotenv.parse.
 * Order matters: escape backslashes first, then quotes, then expand newlines/carriage returns
 * to their `\n` / `\r` literal forms (which dotenv re-expands on read).
 */
export function escapeValue(value: string): string {
  const escaped = value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n').replaceAll('\r', '\\r')
  return `"${escaped}"`
}
