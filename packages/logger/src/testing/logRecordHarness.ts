/**
 * TEST-ONLY reader for the records `logInfo`/`logWarn`/`logError` write.
 *
 * Spelled once because the writers are asserted from many suites, and because
 * the shape is easy to assert loosely in a way that stops catching the two bugs
 * it exists to catch:
 *
 * - The level lives in the PAYLOAD, not in the choice of console method.
 *   Datadog's container tailer classifies by stream before it reads anything,
 *   so a record on stderr is stored as `status:error` however informational the
 *   line is. Asserting `console.warn` was called proved nothing about the level
 *   the record is stored at; asserting `at('warn')` does.
 * - ONE record per event. A second console argument is pretty-printed across
 *   lines and the tailer makes each line its own record, stranding the searched-on
 *   `[prefix]` from the fields that explain it. `readRecord` fails on both.
 */

import type { MockInstance } from 'vitest'
import { expect, vi } from 'vitest'

/** One parsed record, plus the raw line for assertions about serialization. */
export interface LogRecord {
  line: string
  level: string
  message: string
  fields: Record<string, unknown>
}

/** Parses the ONE argument a degrade writer is allowed to pass. */
export function readRecord(call: unknown[]): LogRecord {
  expect(call).toHaveLength(1)
  const value = call[0]
  expect(typeof value).toBe('string')
  const line = String(value)
  expect(line.split('\n')).toHaveLength(1)
  const parsed = JSON.parse(line) as { level: string; message: string; fields: Record<string, unknown> }
  return { line, ...parsed }
}

export interface RecordSpy {
  /** Every record written since the spy was installed, in order. */
  all: () => LogRecord[]
  /** Records at one level — the distinction the stream used to erase. */
  at: (level: 'info' | 'warn' | 'error') => LogRecord[]
  /** The underlying stdout spy, for call counts and restore. */
  mock: MockInstance
}

/**
 * Captures the writers' stdout. Also silences it: these suites drive failure
 * paths on purpose, and the records are the assertion, not output anyone wants
 * in the test log.
 */
export function spyOnRecords(): RecordSpy {
  const mock = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  const all = (): LogRecord[] => mock.mock.calls.map((call) => readRecord(call as unknown[]))
  return {
    all,
    at: (level) => all().filter((record) => record.level === level),
    mock,
  }
}
