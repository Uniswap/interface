import type { ExperimentsMap } from './types'

/**
 * Canonical request/response header name, shared with the backend. This is the only
 * string literal for the header anywhere in the frontend — never hardcode it elsewhere.
 *
 * Backend reference: `packages/services/entry-gateway/src/api.ts` reads `x-experiments`.
 */
export const EXPERIMENTS_HEADER_NAME = 'x-experiments'

/** Serialize the active experiments set into the `x-experiments` header value. */
export function serializeExperimentsHeader(experiments: ExperimentsMap): string {
  return JSON.stringify(experiments)
}

/**
 * Parse an `x-experiments` header value into a map. Mirrors the backend's tolerance:
 * invalid JSON or a non-object payload (array, primitive, null) yields an empty map
 * rather than throwing, so a malformed header can never break a request or render.
 *
 * Backend reference: entry-gateway guards with `typeof parsed === 'object' && !Array.isArray`.
 */
export function parseExperimentsHeader(raw: string | null | undefined): ExperimentsMap {
  if (!raw) {
    return {}
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {}
  }

  return parsed as ExperimentsMap
}
