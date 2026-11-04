import type { MockInstance } from 'vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { describeError, logError, logInfo, logWarn, truncate } from './logRecord'
import { readRecord } from './testing/logRecordHarness'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('describeError', () => {
  it('reads name, message and stack off an Error', () => {
    const error = new TypeError('boom')
    expect(describeError(error)).toMatchObject({ name: 'TypeError', message: 'boom' })
    expect(describeError(error).stack).toBeTruthy()
  })

  it('handles a thrown non-Error', () => {
    expect(describeError('just a string')).toEqual({ name: 'NonError', message: 'just a string' })
  })

  it('handles an object that merely looks like an error', () => {
    expect(describeError({ name: 'WeirdError', message: 'from a library' })).toEqual({
      name: 'WeirdError',
      message: 'from a library',
    })
  })
})

describe('the record shape', () => {
  function stdout(): MockInstance {
    return vi.spyOn(console, 'log').mockImplementation(() => undefined)
  }

  it('puts the message and every field on ONE line', () => {
    const log = stdout()

    logWarn('[cca] GetTokens unavailable', { method: 'GetTokens', attempt: 2 })

    const record = readRecord(log.mock.calls[0] as unknown[])
    expect(record.message).toBe('[cca] GetTokens unavailable')
    expect(record.fields).toEqual({ method: 'GetTokens', attempt: 2 })
    expect(record.line.split('\n')).toHaveLength(1)
  })

  it('keeps a multi-line stack on one line, escaped', () => {
    const log = stdout()

    logWarn('[cca] failed', { error: describeError(new Error('boom')) })

    const record = readRecord(log.mock.calls[0] as unknown[])
    expect(record.line).toContain('\\n')
    expect(record.line).toContain('"message":"boom"')
  })

  it('serializes an Error passed raw rather than flattening it to {}', () => {
    // JSON.stringify(new Error('x')) is '{}' — name/message/stack are not
    // enumerable, so an un-described Error loses everything worth logging.
    const log = stdout()

    logWarn('[cca] failed', { error: new TypeError('nested boom') })

    const record = readRecord(log.mock.calls[0] as unknown[])
    expect(record.fields['error']).toMatchObject({ name: 'TypeError', message: 'nested boom' })
    expect(record.line).toContain('"stack":')
  })

  it('does not throw on a circular object, and keeps the rest of the fields', () => {
    const log = stdout()
    const cyclic: Record<string, unknown> = { method: 'GetTokens' }
    cyclic['self'] = cyclic

    expect(() => logWarn('[cca] failed', { detail: cyclic })).not.toThrow()

    const record = readRecord(log.mock.calls[0] as unknown[])
    expect(record.line).toContain('"method":"GetTokens"')
  })

  it('does not throw on a bigint, which JSON.stringify refuses', () => {
    const log = stdout()

    expect(() => logWarn('[creatorFees] balance', { wei: 12345678901234567890n })).not.toThrow()

    const record = readRecord(log.mock.calls[0] as unknown[])
    expect(record.fields['wei']).toBe('12345678901234567890')
  })

  // `fields` could never split the record because JSON escapes newlines, but
  // `message` is interpolated by callers — so the first one to put an upstream
  // string in it would reintroduce the multi-record shape this module exists
  // to prevent.
  it('collapses a newline in the message so the record cannot split', () => {
    const log = stdout()

    logWarn('[cca] upstream said\nunexpected token < in JSON', { method: 'GetTokens' })

    const record = readRecord(log.mock.calls[0] as unknown[])
    expect(record.message).toBe('[cca] upstream said unexpected token < in JSON')
    expect(record.line).not.toContain('\n')
  })

  it.each([
    ['a CRLF, because it is one break and not two', '[cca] upstream said\r\nHTTP 500', '[cca] upstream said HTTP 500'],
    ['a bare CR, which a line-oriented reader also breaks on', '[cca] 50%\rprogress 100%', '[cca] 50% progress 100%'],
    ['a run of blank lines rather than leaving padding', '[cca] first\n\n\nlast', '[cca] first last'],
  ])('collapses %s', (_label, message, expected) => {
    const log = stdout()

    logWarn(message, {})

    expect(readRecord(log.mock.calls[0] as unknown[]).message).toBe(expected)
  })

  it('keeps the searchable prefix intact when the rest of the message would split', () => {
    const log = stdout()

    logWarn('[cca] GetTokens unavailable\nupstream body', {})

    expect(readRecord(log.mock.calls[0] as unknown[]).message.startsWith('[cca] GetTokens unavailable ')).toBe(true)
  })

  // The regression guard: sanitizing has to be invisible to every message that
  // was already single-line. Each `[prefix]` below is what a Datadog monitor
  // matches on, so rewriting one would silently unhook the monitor.
  it.each([
    ['[cca] GetTokens unavailable'],
    ['[og] token card render failed:'],
    ['[ssr.render_error]'],
    ['[creatorFees] balance'],
    ['inner  spaces and\ttabs are data, not breaks'],
    [''],
  ])('passes %j through byte-identical', (message) => {
    const log = stdout()

    logWarn(message, {})

    expect(readRecord(log.mock.calls[0] as unknown[]).message).toBe(message)
  })
})

describe('logInfo / logWarn / logError', () => {
  function spyConsole(): { log: MockInstance; warn: MockInstance; error: MockInstance; info: MockInstance } {
    return {
      log: vi.spyOn(console, 'log').mockImplementation(() => undefined),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      error: vi.spyOn(console, 'error').mockImplementation(() => undefined),
      info: vi.spyOn(console, 'info').mockImplementation(() => undefined),
    }
  }

  it('passes console exactly one string argument', () => {
    const spies = spyConsole()

    logWarn('[cca] GetTokens unavailable', { error: describeError(new Error('boom')) })

    const record = readRecord(spies.log.mock.calls[0] as unknown[])
    expect(record.message).toBe('[cca] GetTokens unavailable')
    expect(record.fields['error']).toMatchObject({ name: 'Error', message: 'boom' })
  })

  // The regression this whole writer exists for. Datadog's container tailer
  // classifies by stream before it reads anything: stderr is stored as
  // `status:error` however informational the line is, which is how an
  // expected-state sentinel and a crash became the same severity. Writing to
  // stdout and naming the level in the payload is what separates them again,
  // so a writer reaching for console.warn/console.error is the bug returning.
  it.each([
    ['info', logInfo],
    ['warn', logWarn],
    ['error', logError],
  ] as const)('writes %s to stdout, with the level in the payload', (level, write) => {
    const spies = spyConsole()

    write(`[cca] ${level} line`, { method: 'GetTokens' })

    expect(spies.warn).not.toHaveBeenCalled()
    expect(spies.error).not.toHaveBeenCalled()
    expect(spies.info).not.toHaveBeenCalled()
    expect(spies.log).toHaveBeenCalledTimes(1)

    const record = readRecord(spies.log.mock.calls[0] as unknown[])
    expect(record.level).toBe(level)
    expect(record.message).toBe(`[cca] ${level} line`)
    expect(record.fields['method']).toBe('GetTokens')
  })

  // `message` and `status` are Datadog reserved attributes: flat, a caller
  // field named either one would replace the log line or the stored level.
  it('nests caller fields so they cannot collide with the envelope', () => {
    const spies = spyConsole()

    logWarn('[cca] the searched-on line', { message: 'not the log line', status: 200, level: 'info' })

    const record = readRecord(spies.log.mock.calls[0] as unknown[])
    expect(record.message).toBe('[cca] the searched-on line')
    expect(record.level).toBe('warn')
    expect(record.fields['message']).toBe('not the log line')
    expect(record.fields['status']).toBe(200)
    expect(record.fields['level']).toBe('info')
  })

  // The level and message are what a monitor matches on, so they must outlive
  // the fields. `stringifyFields` degrades to key-names-only here; splicing it
  // into the envelope rather than stringifying the whole record is what keeps
  // that degradation local to `fields`.
  it('keeps the level and message when a field refuses to serialize', () => {
    const spies = spyConsole()
    const hostile = {
      toJSON(): never {
        throw new Error('hostile toJSON')
      },
    }

    expect(() => logError('[cca] failed', { method: 'GetTokens', hostile })).not.toThrow()

    const record = readRecord(spies.log.mock.calls[0] as unknown[])
    expect(record.level).toBe('error')
    expect(record.message).toBe('[cca] failed')
    expect(record.fields['unserializable-fields']).toEqual(['method', 'hostile'])
  })

  // JSON.stringify returns undefined rather than throwing for these, which
  // would splice a bare `undefined` into the line and leave no JSON to parse.
  it.each([
    ['a function', (): void => undefined],
    ['a toJSON returning undefined', { toJSON: (): undefined => undefined }],
  ])('keeps the record valid JSON when fields is %s', (_label, fields) => {
    const spies = spyConsole()

    logError('[cca] failed', fields)

    const record = readRecord(spies.log.mock.calls[0] as unknown[])
    expect(record.level).toBe('error')
    expect(record.message).toBe('[cca] failed')
    expect(record.fields).toEqual({})
  })

  // The shape the writers exist to prevent, reached the one way still open:
  // interpolating an upstream string into the message instead of the fields.
  it('still lands on ONE record when the message interpolates an upstream string', () => {
    const spies = spyConsole()
    const upstream = 'HTTP 500\nunexpected token < in JSON'

    logWarn(`[cca] GetTokens unavailable: ${upstream}`, { method: 'GetTokens' })

    const record = readRecord(spies.log.mock.calls[0] as unknown[])
    expect(record.message).toBe('[cca] GetTokens unavailable: HTTP 500 unexpected token < in JSON')
    expect(record.fields['method']).toBe('GetTokens')
  })
})

describe('truncate', () => {
  const WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18'

  it('leaves a value within the cap untouched', () => {
    expect(truncate('short', 10)).toBe('short')
  })

  it('cuts to the cap, ellipsis included', () => {
    const cut = truncate('x'.repeat(50), 10)
    expect(cut).toHaveLength(10)
    expect(cut.endsWith('…')).toBe(true)
  })

  it('backs off to the start of a hex run rather than leaving a partial address', () => {
    const cut = truncate(`balance for ${WALLET}`, 30)
    expect(cut).toBe('balance for …')
  })

  it('keeps an address that ends before the cut', () => {
    expect(truncate(`${WALLET} is the wallet that failed`, 50)).toBe(`${WALLET} is the…`)
  })

  it('drops a hex run that starts the value rather than keep its prefix', () => {
    expect(truncate(`${WALLET} failed`, 20)).toBe('…')
  })
})
