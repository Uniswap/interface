/**
 * PII Scrubbing Layer
 *
 * Two-layer defense: path-based redaction for known fields, then regex pattern
 * scanning for PII in arbitrary string values.
 *
 * The path redactor is a small pure-JS walker (no code generation). It replaces the
 * previous fast-redact implementation, which relies on `new Function` and is therefore
 * blocked by the web app's Content-Security-Policy (`unsafe-eval`). Keeping this eval-free
 * lets the scrubber — and any logger that constructs it — run in the browser.
 *
 * Explicit contract: configurable patterns, injectable into logger pipeline.
 */

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
  /** Paths to redact (e.g., 'headers.cookie', '*.password', '["set-cookie"]') */
  redactPaths?: string[]
  /** Regex patterns for string scanning */
  patterns?: ScrubPattern[]
}

/** The scrubber function signature */
export type Scrubber = (obj: Record<string, unknown>) => Record<string, unknown>

const CENSOR = '[REDACTED]'
const CIRCULAR = '[Circular]'

/**
 * `**.<key>` matches that key at any depth, which is what a logger needs: sensitive fields turn up
 * wherever the payload happens to nest them (`error.config.headers.authorization`, `body.input.password`).
 * These subsume the plain and single-wildcard forms, so one entry per key covers every depth.
 */
export const DEFAULT_REDACT_PATHS: string[] = [
  '**.password',
  '**.secret',
  '**.authorization',
  '**.cookie',
  '**["set-cookie"]',
  '**["x-api-key"]',
  '**.credentials',
  '**.email',
  '**.identifier',
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

/**
 * A redact-path token. `'*'` matches every key at its level, `'**'` spans any number of levels
 * (including none), and a string matches that exact key. Grammar otherwise mirrors fast-redact:
 * dot separators and bracketed keys (`["set-cookie"]`, `[*]`).
 */
type PathToken = { deep: true } | { wildcard: true } | { wildcard: false; key: string }

/** A parsed path tracked at `index` (how many tokens have been consumed) while walking. */
interface PathMatcher {
  tokens: PathToken[]
  index: number
}

type MatchStep = { censor: boolean; next: PathMatcher[] }

/** Walk state: the matchers still in play at this depth, plus the ancestor set used to spot cycles. */
interface WalkState {
  matchers: PathMatcher[]
  seen: Set<object>
}

const PATH_TOKEN_RX = /[^.[\]]+|\[(?:.*?)\]/g
const NO_MATCH: MatchStep = { censor: false, next: [] }

/** Parse a redact-path string into tokens. Returns [] for an empty/unparseable path. */
function parseRedactPath(path: string): PathToken[] {
  const matches = path.match(PATH_TOKEN_RX)
  if (!matches) {
    return []
  }
  return matches.map((raw) => {
    // Strip quotes then surrounding brackets, matching fast-redact's parse step.
    let segment = raw.replace(/['"`]/g, '')
    if (segment.startsWith('[')) {
      segment = segment.slice(1, -1)
    }
    if (segment === '**') {
      return { deep: true }
    }
    return segment === '*' ? { wildcard: true } : { wildcard: false, key: segment }
  })
}

/**
 * Advance every matcher across one key. Reports whether the key is a redaction leaf (a path
 * ended here) and which matchers continue into its children.
 */
function advanceMatchers(matchers: PathMatcher[], key: string): MatchStep {
  if (matchers.length === 0) {
    return NO_MATCH
  }
  let censor = false
  const next: PathMatcher[] = []
  for (const { tokens, index } of matchers) {
    const token = tokens[index]
    if (!token) {
      continue
    }
    if ('deep' in token) {
      // `**` spans any number of levels: it stays alive for the children and, having also matched
      // zero levels, offers the following token against this key.
      next.push({ tokens, index })
      if (index === tokens.length - 1) {
        censor = true
        continue
      }
      const after = tokens[index + 1]
      if (!after || 'deep' in after || (!after.wildcard && after.key !== key)) {
        continue
      }
      if (index + 1 === tokens.length - 1) {
        censor = true
      } else {
        next.push({ tokens, index: index + 2 })
      }
      continue
    }
    if (!token.wildcard && token.key !== key) {
      continue
    }
    if (index === tokens.length - 1) {
      censor = true
    } else {
      next.push({ tokens, index: index + 1 })
    }
  }
  return { censor, next }
}

/**
 * Object types returned by reference: they hold no scannable string properties, and rebuilding
 * them would drop internal state (WeakMap/WeakSet/Promise expose no enumerable contents at all).
 */
function isOpaqueObject(value: object): boolean {
  return (
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof WeakMap ||
    value instanceof WeakSet ||
    value instanceof Promise ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  )
}

/**
 * Resolve an own property to a data descriptor. A getter is read via `Reflect.get` so it runs against
 * the original object: V8 backs `error.stack` with an own accessor, and copying that accessor onto the
 * clone would read as undefined. Anything unreadable (setter-only, throwing getter) comes back as the
 * original descriptor for the caller to copy verbatim.
 */
function resolveOwnProperty(target: object, key: string): PropertyDescriptor | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(target, key)
  // Absent, a plain data property, or setter-only — nothing to invoke.
  if (!descriptor || !descriptor.get) {
    return descriptor
  }
  try {
    return {
      value: Reflect.get(target, key),
      writable: descriptor.set !== undefined,
      enumerable: descriptor.enumerable,
      configurable: descriptor.configurable,
    }
  } catch {
    return descriptor
  }
}

/** `{}`-shaped: a plain record, safe to rebuild with a bare object literal. */
function isPlainObject(value: object): boolean {
  return Object.getPrototypeOf(value) === Object.prototype
}

/** Scan a string value and replace all matching patterns. */
function scrubString(value: string, patterns: ScrubPattern[]): string {
  let result = value
  for (const { pattern, replacement } of patterns) {
    // Reset lastIndex for global regexps to ensure clean state.
    pattern.lastIndex = 0
    result = result.replace(pattern, replacement)
  }
  return result
}

/**
 * Create a scrubber function with the given options.
 *
 * A single non-mutating pass does both jobs:
 *   - path redaction — a matched path's value becomes "[REDACTED]"
 *   - pattern scanning — every remaining string is scanned for PII patterns
 *
 * Eval-free (no code generation), so it is safe under a strict CSP. Null/undefined leaves
 * are left untouched — they carry no PII.
 *
 * Rebuilt values keep their prototype, so an Error stays an Error (message/stack scrubbed but
 * present) and Map/Set/Date keep their contents. Cycles resolve to "[Circular]" rather than
 * overflowing the stack — a logger must never throw on the data it was handed.
 */
export function createScrubber(options?: ScrubberOptions): Scrubber {
  const patterns = options?.patterns ?? DEFAULT_SCRUB_PATTERNS
  const parsed = Array.from(new Set(options?.redactPaths ?? DEFAULT_REDACT_PATHS))
    .map(parseRedactPath)
    .filter((tokens) => tokens.length > 0)

  // `**.key` — one literal key at any depth — carries no positional state, so it collapses to a set
  // lookup per key instead of a matcher that has to be advanced and reallocated at every level.
  const deepKeys = new Set<string>()
  const rootMatchers: PathMatcher[] = []
  for (const tokens of parsed) {
    const [first, second] = tokens
    if (tokens.length === 2 && first && second && 'deep' in first && 'key' in second) {
      deepKeys.add(second.key)
    } else {
      rootMatchers.push({ tokens, index: 0 })
    }
  }
  const hasDeepKeys = deepKeys.size > 0

  /** Redact a matched leaf, else recurse. Present-but-falsey values are still censored. */
  function step([key, child]: [string, unknown], state: WalkState): unknown {
    const present = child !== null && child !== undefined
    if (hasDeepKeys && present && deepKeys.has(key)) {
      return CENSOR
    }
    const { censor, next } = advanceMatchers(state.matchers, key)
    if (censor && present) {
      return CENSOR
    }
    return walk(child, { matchers: next, seen: state.seen })
  }

  /** Rebuild a non-plain object, preserving its prototype and each property's own descriptor. */
  function walkInstance(value: object, state: WalkState): object {
    const result = Object.create(Object.getPrototypeOf(value) as object | null) as object
    // getOwnPropertyNames, not Object.keys: an Error's message/stack are own but non-enumerable.
    for (const key of Object.getOwnPropertyNames(value)) {
      const descriptor = resolveOwnProperty(value, key)
      if (!descriptor) {
        continue
      }
      if (!('value' in descriptor)) {
        // An accessor whose value could not be read — copy it as it stands.
        Object.defineProperty(result, key, descriptor)
        continue
      }
      // Enumerability carries over, so a scrubbed Error still serializes to {} like the original.
      Object.defineProperty(result, key, { ...descriptor, value: step([key, descriptor.value], state) })
    }
    return result
  }

  function walkContainer(value: object, state: WalkState): unknown {
    if (Array.isArray(value)) {
      return value.map((item, index) => step([String(index), item], state))
    }
    if (value instanceof Map) {
      const result = new Map<unknown, unknown>()
      for (const [key, child] of value) {
        // Only string keys can take part in path matching; other keys just get their values walked.
        const scrubbed =
          typeof key === 'string' ? step([key, child], state) : walk(child, { matchers: [], seen: state.seen })
        result.set(key, scrubbed)
      }
      return result
    }
    if (value instanceof Set) {
      return new Set(Array.from(value, (item) => walk(item, { matchers: [], seen: state.seen })))
    }
    if (isPlainObject(value)) {
      const result: Record<string, unknown> = {}
      for (const entry of Object.entries(value)) {
        result[entry[0]] = step(entry, state)
      }
      return result
    }
    return walkInstance(value, state)
  }

  function walk(value: unknown, state: WalkState): unknown {
    if (typeof value === 'string') {
      return scrubString(value, patterns)
    }
    // Numbers, booleans, null, undefined, functions and symbols pass through untouched.
    if (value === null || typeof value !== 'object') {
      return value
    }
    if (state.seen.has(value)) {
      return CIRCULAR
    }
    if (isOpaqueObject(value)) {
      return value
    }
    // Tracked only while its own branch is walked, so a repeated sibling reference is not a cycle.
    state.seen.add(value)
    try {
      return walkContainer(value, state)
    } finally {
      state.seen.delete(value)
    }
  }

  return (obj: Record<string, unknown>): Record<string, unknown> =>
    walk(obj, { matchers: rootMatchers, seen: new Set<object>() }) as Record<string, unknown>
}
