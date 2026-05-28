/**
 * PII Scrubbing Layer
 *
 * Two-layer defense: path-based redaction (fast-redact) for known fields,
 * then regex pattern scanning for PII in arbitrary string values.
 *
 * Explicit contract: configurable patterns, injectable into logger pipeline.
 */

import fastRedact from 'fast-redact'

/** Pattern definition for regex-based string scanning */
export interface ScrubPattern {
  /** Human-readable name for this pattern */
  name: string
  /** Regex to match sensitive data */
  pattern: RegExp
  /** Replacement string */
  replacement: string
}

/** Configuration for the scrubber factory */
export interface ScrubberOptions {
  /** Paths to redact via fast-redact (e.g., 'headers.cookie') */
  redactPaths?: string[]
  /** Regex patterns for string scanning */
  patterns?: ScrubPattern[]
}

/** The scrubber function signature */
export type Scrubber = (obj: Record<string, unknown>) => Record<string, unknown>

export const DEFAULT_REDACT_PATHS: string[] = [
  'password',
  'secret',
  'authorization',
  'cookie',
  '["set-cookie"]',
  '["x-api-key"]',
  'credentials',
  'email',
  'identifier',
  '*.email',
  '*.identifier',
  '*.password',
  '*.secret',
  '*.authorization',
  '*.cookie',
  'headers.cookie',
  'headers.authorization',
]

export const DEFAULT_SCRUB_PATTERNS: ScrubPattern[] = [
  {
    name: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[EMAIL_REDACTED]',
  },
  {
    name: 'jwt',
    pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
    replacement: '[JWT_REDACTED]',
  },
  {
    name: 'api_key',
    pattern: /(?:api[_-]?key|token|secret|authorization)['":\s]*[a-zA-Z0-9_-]{32,}/gi,
    replacement: '[API_KEY_REDACTED]',
  },
  {
    name: 'ethereum_address',
    pattern: /0x[a-fA-F0-9]{40}/g,
    replacement: '[WALLET_REDACTED]',
  },
  {
    name: 'ipv4',
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replacement: '[IP_REDACTED]',
  },
]

/** Scan a string value and replace all matching patterns */
function scrubString(value: string, patterns: ScrubPattern[]): string {
  let result = value
  for (const { pattern, replacement } of patterns) {
    // Reset lastIndex for global regexps to ensure clean state
    pattern.lastIndex = 0
    result = result.replace(pattern, replacement)
  }
  return result
}

/** Recursively walk an object and scrub all string values */
function scrubValue(value: unknown, patterns: ScrubPattern[]): unknown {
  if (typeof value === 'string') {
    return scrubString(value, patterns)
  }
  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, patterns))
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = scrubValue(val, patterns)
    }
    return result
  }
  // Numbers, booleans, null, undefined pass through untouched
  return value
}

/**
 * Create a scrubber function with the given options.
 *
 * Layer 1: fast-redact replaces known sensitive paths with "[REDACTED]"
 * Layer 2: regex patterns scan all remaining string values for PII
 */
export function createScrubber(options?: ScrubberOptions): Scrubber {
  const redactPaths = options?.redactPaths ?? DEFAULT_REDACT_PATHS
  const patterns = options?.patterns ?? DEFAULT_SCRUB_PATTERNS

  const redact = fastRedact({
    paths: redactPaths,
    serialize: false,
    censor: '[REDACTED]',
  }) as (obj: Record<string, unknown>) => Record<string, unknown>

  return (obj: Record<string, unknown>): Record<string, unknown> => {
    // Layer 1: path-based redaction (mutates in place, returns same ref)
    const redacted = redact(obj)

    // Layer 2: pattern-based string scanning (returns new object)
    return scrubValue(redacted, patterns) as Record<string, unknown>
  }
}
