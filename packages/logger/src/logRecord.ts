/**
 * The one-record writer: `logInfo` / `logWarn` / `logError` put ONE JSON line
 * on stdout per event, with the level in the payload.
 *
 * Isomorphic (a single `console.log` of a string), so it lives in the
 * client-safe barrel; `@universe/logger/server` re-exports it.
 */

/**
 * Size caps for the two attacker-influenceable strings of a client-reported
 * error. A reporter truncates to them when it builds an entry, so an oversized
 * stack can never fail validation at the ingest boundary — entries travel in
 * batches, and one rejected entry would take every other entry in its batch
 * down with it. `logIngestSchema` enforces the same numbers server-side (it
 * can't trust the client to have done it).
 */
export const MAX_MESSAGE_CHARS = 2_000
export const MAX_STACK_CHARS = 10_000

/**
 * Truncates without ever cutting through a `0x…` hex run.
 *
 * Slicing mid-address leaves a partial run that matches no scrubber rule, so a
 * prefix of a real wallet would survive redaction: the redactor only protects
 * what still looks like the thing it is looking for. When the cut lands inside
 * a run that continues past it, back up to where the run started.
 */
export function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value
  }
  let cut = max - 1
  const continuesPastCut = /[a-fA-F0-9]/.test(value.charAt(cut))
  if (continuesPastCut) {
    const runStart = /0x[a-fA-F0-9]*$/.exec(value.slice(0, cut))
    if (runStart) {
      cut = runStart.index
    }
  }
  return `${value.slice(0, cut)}…`
}

/** Pulls name/message/stack off an unknown throwable without assuming Error. */
export function describeError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { name: error.name || 'Error', message: error.message, stack: error.stack }
  }
  if (typeof error === 'object' && error !== null) {
    const maybe = error as { name?: unknown; message?: unknown; stack?: unknown }
    if (typeof maybe.message === 'string') {
      return {
        name: typeof maybe.name === 'string' ? maybe.name : 'Object',
        message: maybe.message,
        // Cross-realm errors and library error-likes carry a real stack;
        // dropping it left these reports unattributable.
        ...(typeof maybe.stack === 'string' ? { stack: maybe.stack } : {}),
      }
    }
  }
  return { name: 'NonError', message: describeNonError(error) }
}

/**
 * A readable summary of a throwable that isn't an Error and carries no
 * `message`. `String(obj)` yields "[object Object]".
 *
 * KEY NAMES ONLY, never values. Serializing the object would flatten it to a
 * string before `@universe/privacy`'s path-based redaction could see its keys,
 * so a custom error carrying `password` or `authorization` in a field would
 * escape the layer that exists to catch exactly that, and `logError` below
 * runs no redaction at all. The field names alone say what kind of thing threw.
 */
function describeNonError(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return String(error)
  }
  const label = Object.prototype.toString.call(error)
  const keys = Object.keys(error)
  if (keys.length === 0) {
    return label
  }
  const shown = keys.slice(0, 20).join(', ')
  return `${label} keys: ${shown}${keys.length > 20 ? ', …' : ''}`
}

/**
 * Serializes `fields` for a log line: no newline, and never throws.
 *
 * Errors go through `describeError` because `JSON.stringify(new Error('x'))` is
 * `{}` — `stack` is not enumerable. bigints are stringified because
 * `JSON.stringify` throws on them (wei amounts). A repeated node costs only
 * itself, not the line.
 *
 * The `catch` is the floor: a hostile `toJSON`, a Proxy that throws on read, or
 * anything else `stringify` refuses must not turn a degraded read into a crash
 * on the very path that exists to record it. Key names alone still say what the
 * caller was holding.
 */
function stringifyFields(fields: object): string {
  const seen = new WeakSet<object>()
  try {
    // The lib types say string, but a function or a `toJSON` returning undefined
    // yields undefined rather than a throw.
    const json = JSON.stringify(fields, (_key, value: unknown) => {
      if (value instanceof Error) {
        return describeError(value)
      }
      if (typeof value === 'bigint') {
        return value.toString()
      }
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[circular]'
        }
        seen.add(value)
      }
      return value
    }) as string | undefined
    return json ?? '{}'
  } catch {
    return JSON.stringify({ 'unserializable-fields': Object.keys(fields) })
  }
}

type LogLineLevel = 'info' | 'warn' | 'error'

interface LogLineRecord {
  level: LogLineLevel
  message: string
  fields: object
}

/**
 * ONE JSON record per event, carrying its own level.
 *
 * The level travels in the payload because that is what decides the level the
 * record is STORED at. Datadog's container tailer classifies by stream first —
 * `console.warn` and `console.error` write to stderr, which it stores as
 * `status:error` however informational the line is — and only a parsed `level`
 * on a JSON line overrides that. So picking the matching console method
 * achieves nothing; naming the level as a field is the whole mechanism.
 *
 * `fields` is nested rather than spread so that neither half can damage the
 * other: a caller field named `message` or `status` would otherwise collide with
 * a Datadog reserved attribute and replace the log line or the level. For the
 * same reason the envelope is spliced in rather than handed to one `stringify`
 * call — `stringifyFields` has its own floor for a field that refuses to
 * serialize, and stringifying the whole record would put the level and message,
 * the part a monitor matches on, behind that floor too.
 *
 * Only newlines are collapsed from `message`; it must otherwise survive
 * byte-identical, because the `[prefix]` Datadog monitors match on lives in it.
 */
function recordLine({ level, message, fields }: LogLineRecord): string {
  const envelope = JSON.stringify({ level, message: message.replace(/[\r\n]+/g, ' ') })
  return `${envelope.slice(0, -1)},"fields":${stringifyFields(fields)}}`
}

/**
 * Centralized so no call site can lose the one-record shape by passing a second
 * argument. A second argument is the shape that mattered most: Node
 * pretty-prints an object across lines, and the tailer records each line
 * separately, so one event arrived as a `{`, a record per field, and a `}`,
 * with the searched-on prefix stranded from the fields.
 *
 * One code path, no dev/prod branch: the record these emit locally is the record
 * prod emits, so a test asserting on it asserts on the real thing.
 */
function writeRecord(record: LogLineRecord): void {
  // The sink: Datadog tails the container's stdout.
  console.log(recordLine(record))
}

// logInfo / logWarn / logError write `fields` to stdout UNSCRUBBED: no
// `@universe/privacy` pass runs on this path. Pass identifiers and outcomes,
// never user input, secrets or PII; route those through
// `createStructuredJsonLogger`, which scrubs before it serializes.

/** A degrade: a fallback the app took, not a crash. */
export function logWarn(message: string, fields: object): void {
  writeRecord({ level: 'warn', message, fields })
}

export function logError(message: string, fields: object): void {
  writeRecord({ level: 'error', message, fields })
}

/** Expected-state sentinels worth finding in Datadog, not degrades. */
export function logInfo(message: string, fields: object): void {
  writeRecord({ level: 'info', message, fields })
}
