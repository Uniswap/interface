import { describe, expect, it } from 'vitest'
import type { ScrubPattern } from './scrub'
import { createScrubber, DEFAULT_REDACT_PATHS, DEFAULT_SCRUB_PATTERNS } from './scrub'

const REDACTED = '[REDACTED]'

describe('createScrubber — path redaction', () => {
  const scrub = createScrubber({ patterns: [] }) // isolate Layer 1 (no pattern scanning)

  it('redacts a top-level sensitive key', () => {
    expect(scrub({ password: 'hunter2', keep: 'ok' })).toEqual({ password: REDACTED, keep: 'ok' })
  })

  it('redacts every default sensitive top-level key', () => {
    expect(
      scrub({
        password: 'a',
        secret: 'b',
        authorization: 'c',
        cookie: 'd',
        credentials: 'e',
        email: 'f',
        identifier: 'g',
      }),
    ).toEqual({
      password: REDACTED,
      secret: REDACTED,
      authorization: REDACTED,
      cookie: REDACTED,
      credentials: REDACTED,
      email: REDACTED,
      identifier: REDACTED,
    })
  })

  it('redacts bracketed keys with hyphens', () => {
    expect(scrub({ 'set-cookie': 'x', 'x-api-key': 'y', ok: 'z' })).toEqual({
      'set-cookie': REDACTED,
      'x-api-key': REDACTED,
      ok: 'z',
    })
  })

  it('redacts nested dotted paths', () => {
    expect(scrub({ headers: { cookie: 'c', authorization: 'a', host: 'example.com' } })).toEqual({
      headers: { cookie: REDACTED, authorization: REDACTED, host: 'example.com' },
    })
  })

  it('redacts leading-wildcard paths one level deep', () => {
    expect(scrub({ user: { email: 'a@b.com', password: 'p', name: 'jo' } })).toEqual({
      user: { email: REDACTED, password: REDACTED, name: 'jo' },
    })
  })

  it('redacts a sensitive key at any depth', () => {
    expect(scrub({ level1: { level2: { level3: { password: 'deep' } } } })).toEqual({
      level1: { level2: { level3: { password: REDACTED } } },
    })
    expect(scrub({ a: { b: { c: { d: { e: { secret: 's' } } } } } })).toEqual({
      a: { b: { c: { d: { e: { secret: REDACTED } } } } },
    })
  })

  it('redacts the shapes that actually show up in logs', () => {
    expect(scrub({ error: { config: { headers: { authorization: 'Bearer xyz' } } } })).toEqual({
      error: { config: { headers: { authorization: REDACTED } } },
    })
    expect(scrub({ body: { input: { password: 'hunter2' } } })).toEqual({ body: { input: { password: REDACTED } } })
    expect(scrub({ request: { headers: { 'set-cookie': 'a=1' } } })).toEqual({
      request: { headers: { 'set-cookie': REDACTED } },
    })
  })

  it('redacts a sensitive key nested inside arrays', () => {
    expect(scrub({ users: [{ profile: { email: 'a@b.com' } }, { profile: { email: 'c@d.com' } }] })).toEqual({
      users: [{ profile: { email: REDACTED } }, { profile: { email: REDACTED } }],
    })
  })

  it('redacts a sensitive key on a nested Error', () => {
    const error = Object.assign(new Error('nope'), { meta: { password: 'p' } })
    const result = scrub({ ctx: { error } }) as { ctx: { error: Error & { meta: { password: string } } } }
    expect(result.ctx.error.meta.password).toBe(REDACTED)
  })

  it('leaves non-sensitive keys alone at every depth', () => {
    const input = { a: { b: { c: { username: 'jo', count: 3 } } } }
    expect(scrub(input)).toEqual(input)
  })

  it('censors the whole value when an object or array sits at a redacted leaf', () => {
    // Keeping the container would keep its keys, and a key can itself be the identifier.
    expect(scrub({ credentials: { 'alice@example.com': 'p', user: 'u' }, cookie: ['a', 'b'] })).toEqual({
      credentials: REDACTED,
      cookie: REDACTED,
    })
  })

  it('censors falsey-but-present values', () => {
    expect(scrub({ password: 0, secret: false, cookie: '' })).toEqual({
      password: REDACTED,
      secret: REDACTED,
      cookie: REDACTED,
    })
  })

  it('leaves null and undefined leaves untouched (no PII)', () => {
    expect(scrub({ password: null, secret: undefined, user: { email: null } })).toEqual({
      password: null,
      secret: undefined,
      user: { email: null },
    })
  })

  it('does not fabricate keys for missing paths', () => {
    expect(scrub({ present: 1 })).toEqual({ present: 1 })
  })

  it('leaves non-sensitive keys alone', () => {
    expect(scrub({ username: 'jo', count: 3, nested: { label: 'x' } })).toEqual({
      username: 'jo',
      count: 3,
      nested: { label: 'x' },
    })
  })
})

describe('createScrubber — custom redact paths', () => {
  it('honors a custom simple path and ignores defaults', () => {
    const scrub = createScrubber({ redactPaths: ['token'], patterns: [] })
    expect(scrub({ token: 't', password: 'p' })).toEqual({ token: REDACTED, password: 'p' })
  })

  it('supports an intermediate wildcard', () => {
    const scrub = createScrubber({ redactPaths: ['a.*.c'], patterns: [] })
    expect(scrub({ a: { x: { c: 1 }, y: { c: 2 }, z: { d: 3 } } })).toEqual({
      a: { x: { c: REDACTED }, y: { c: REDACTED }, z: { d: 3 } },
    })
  })

  it('supports multiple wildcards', () => {
    const scrub = createScrubber({ redactPaths: ['*.*'], patterns: [] })
    expect(scrub({ a: { b: 1 }, c: { d: 2 } })).toEqual({ a: { b: REDACTED }, c: { d: REDACTED } })
  })

  it('supports a bracketed wildcard', () => {
    const scrub = createScrubber({ redactPaths: ['[*]'], patterns: [] })
    expect(scrub({ a: 1, b: 2 })).toEqual({ a: REDACTED, b: REDACTED })
  })

  it('redacts array elements via a trailing wildcard', () => {
    const scrub = createScrubber({ redactPaths: ['items.*'], patterns: [] })
    expect(scrub({ items: ['a', 'b'], other: 'keep' })).toEqual({ items: [REDACTED, REDACTED], other: 'keep' })
  })

  it('matches wildcards across array indices', () => {
    const scrub = createScrubber({ redactPaths: ['list.*.token'], patterns: [] })
    expect(scrub({ list: [{ token: 'x' }, { token: 'y', keep: 1 }] })).toEqual({
      list: [{ token: REDACTED }, { token: REDACTED, keep: 1 }],
    })
  })

  it('supports `**` before a single key, at every depth including zero', () => {
    const scrub = createScrubber({ redactPaths: ['**.token'], patterns: [] })
    expect(scrub({ token: 'a', x: { token: 'b' }, y: { z: { token: 'c' } }, keep: 1 })).toEqual({
      token: REDACTED,
      x: { token: REDACTED },
      y: { z: { token: REDACTED } },
      keep: 1,
    })
  })

  it('supports `**` followed by a multi-token path', () => {
    const scrub = createScrubber({ redactPaths: ['**.headers.cookie'], patterns: [] })
    expect(scrub({ headers: { cookie: 'a', host: 'h' }, req: { headers: { cookie: 'b' } }, cookie: 'top' })).toEqual({
      headers: { cookie: REDACTED, host: 'h' },
      req: { headers: { cookie: REDACTED } },
      cookie: 'top', // `cookie` alone is not `headers.cookie`
    })
  })

  it('supports `**` combined with a single wildcard', () => {
    const scrub = createScrubber({ redactPaths: ['**.*.secret'], patterns: [] })
    expect(scrub({ a: { secret: 's' }, deep: { b: { secret: 's' } }, secret: 'top' })).toEqual({
      a: { secret: REDACTED },
      deep: { b: { secret: REDACTED } },
      secret: 'top', // needs at least one level before `secret`
    })
  })

  it('supports a trailing `**`, which censors everything below', () => {
    const scrub = createScrubber({ redactPaths: ['creds.**'], patterns: [] })
    expect(scrub({ creds: { a: 1, b: { c: 2 } }, keep: 'x' })).toEqual({
      creds: { a: REDACTED, b: REDACTED },
      keep: 'x',
    })
  })

  it('supports a bracketed key after `**`', () => {
    const scrub = createScrubber({ redactPaths: ['**["set-cookie"]'], patterns: [] })
    expect(scrub({ a: { b: { 'set-cookie': 'x' } } })).toEqual({ a: { b: { 'set-cookie': REDACTED } } })
  })

  it('handles empty redact paths, and empty pattern list', () => {
    const scrub = createScrubber({ redactPaths: [], patterns: [] })
    expect(scrub({ password: 'p', email: 'a@b.com' })).toEqual({ password: 'p', email: 'a@b.com' })
  })
})

describe('createScrubber — pattern scrubbing', () => {
  const scrub = createScrubber({ redactPaths: [] }) // isolate Layer 2 (default patterns only)

  it('redacts emails inside string values', () => {
    expect(scrub({ note: 'reach me at jo@example.com please' })).toEqual({
      note: 'reach me at [EMAIL_REDACTED] please',
    })
  })

  it('redacts JWTs', () => {
    const jwt = 'eyJhbGciOiJIUzI1Nitest.eyJzdWIiOiIxMjM0NTY3test.SflKxwRJSMeKKF2QT4test'
    expect(scrub({ auth: `Bearer ${jwt}` })).toEqual({ auth: 'Bearer [JWT_REDACTED]' })
  })

  it('redacts long API-key-like tokens', () => {
    expect(scrub({ msg: 'token: abcdefghijklmnopqrstuvwxyz0123456789' })).toEqual({ msg: '[API_KEY_REDACTED]' })
  })

  it('redacts ethereum addresses', () => {
    expect(scrub({ to: 'sent to 0x1234567890abcdef1234567890ABCDEF12345678 now' })).toEqual({
      to: 'sent to [WALLET_REDACTED] now',
    })
  })

  it('redacts IPv4 addresses', () => {
    expect(scrub({ from: 'client 192.168.1.100 connected' })).toEqual({ from: 'client [IP_REDACTED] connected' })
  })

  it('redacts multiple matches in a single string', () => {
    expect(scrub({ note: 'a@b.com and c@d.org' })).toEqual({ note: '[EMAIL_REDACTED] and [EMAIL_REDACTED]' })
  })

  it('scrubs recursively through nested objects and arrays', () => {
    expect(scrub({ outer: { list: ['ping 10.0.0.1', { host: 'x@y.com' }] } })).toEqual({
      outer: { list: ['ping [IP_REDACTED]', { host: '[EMAIL_REDACTED]' }] },
    })
  })

  it('leaves non-string values untouched', () => {
    expect(scrub({ n: 42, b: true, z: null })).toEqual({ n: 42, b: true, z: null })
  })

  it('applies custom patterns', () => {
    const patterns: ScrubPattern[] = [{ name: 'ssn', pattern: /\d{3}-\d{2}-\d{4}/g, replacement: '[SSN]' }]
    const custom = createScrubber({ redactPaths: [], patterns })
    expect(custom({ note: 'ssn 123-45-6789' })).toEqual({ note: 'ssn [SSN]' })
  })
})

describe('createScrubber — layer interaction', () => {
  const scrub = createScrubber()

  it('path redaction takes precedence over pattern scrubbing on the same value', () => {
    // The whole value is replaced with [REDACTED], not partially pattern-scrubbed.
    expect(scrub({ password: 'leak@example.com' })).toEqual({ password: REDACTED })
  })

  it('applies both layers across a mixed object', () => {
    expect(scrub({ password: 'p', note: 'from 1.2.3.4', user: { email: 'a@b.com', bio: 'hi c@d.com' } })).toEqual({
      password: REDACTED,
      note: 'from [IP_REDACTED]',
      user: { email: REDACTED, bio: 'hi [EMAIL_REDACTED]' },
    })
  })
})

describe('createScrubber — non-mutation & reuse', () => {
  it('does not mutate the input object', () => {
    const scrub = createScrubber()
    const input = { password: 'p', user: { email: 'a@b.com' }, list: ['x@y.com'] }
    const before = structuredClone(input)
    const output = scrub(input)

    expect(input).toEqual(before) // input untouched
    expect(output).not.toBe(input) // fresh object returned
    expect(output).toEqual({ password: REDACTED, user: { email: REDACTED }, list: ['[EMAIL_REDACTED]'] })
  })

  it('produces stable results across repeated calls (global-regex lastIndex is reset)', () => {
    const scrub = createScrubber()
    const run = (): Record<string, unknown> => scrub({ note: 'a@b.com', ip: 'x 1.2.3.4' })
    const first = run()
    expect(run()).toEqual(first)
    expect(run()).toEqual(first)
    expect(first).toEqual({ note: '[EMAIL_REDACTED]', ip: 'x [IP_REDACTED]' })
  })

  it('handles an empty object', () => {
    expect(createScrubber()({})).toEqual({})
  })
})

describe('createScrubber — cycles', () => {
  const scrub = createScrubber()

  it('replaces a self-referencing object with [Circular]', () => {
    const input: Record<string, unknown> = { name: 'a@b.com' }
    input['self'] = input
    expect(scrub(input)).toEqual({ name: '[EMAIL_REDACTED]', self: '[Circular]' })
  })

  it('replaces a cycle through nested objects', () => {
    const parent: Record<string, unknown> = { id: 1 }
    const child: Record<string, unknown> = { parent, note: 'ip 1.2.3.4' }
    parent['child'] = child
    expect(scrub({ parent })).toEqual({
      parent: { id: 1, child: { parent: '[Circular]', note: 'ip [IP_REDACTED]' } },
    })
  })

  it('replaces a cycle through an array', () => {
    const list: unknown[] = ['a@b.com']
    list.push(list)
    expect(scrub({ list })).toEqual({ list: ['[EMAIL_REDACTED]', '[Circular]'] })
  })

  it('replaces a cycle through an error cause chain', () => {
    const outer = new Error('outer')
    const inner = new Error('inner')
    outer.cause = inner
    inner.cause = outer
    const result = scrub({ error: outer }) as { error: Error & { cause: { cause: string } } }
    expect(result.error.message).toBe('outer')
    expect(result.error.cause.cause).toBe('[Circular]')
  })

  it('produces output that JSON.stringify can serialize', () => {
    const input: Record<string, unknown> = { a: 1 }
    input['loop'] = input
    expect(() => JSON.stringify(scrub(input))).not.toThrow()
  })

  it('does not flag a repeated sibling reference as circular', () => {
    // Same object twice in different branches is a DAG, not a cycle.
    const shared = { email: 'a@b.com' }
    expect(scrub({ x: shared, y: shared })).toEqual({ x: { email: REDACTED }, y: { email: REDACTED } })
  })

  it('walks a repeated reference again after leaving its branch', () => {
    const shared = { note: 'ip 1.2.3.4' }
    expect(scrub({ a: { shared }, b: { shared } })).toEqual({
      a: { shared: { note: 'ip [IP_REDACTED]' } },
      b: { shared: { note: 'ip [IP_REDACTED]' } },
    })
  })
})

describe('createScrubber — non-plain objects', () => {
  const scrub = createScrubber()

  it('keeps an Error an Error, with message and stack scrubbed', () => {
    const error = new Error('failed for alice@example.com')
    const result = scrub({ error }).error as Error

    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('failed for [EMAIL_REDACTED]')
    expect(result.stack).toContain('[EMAIL_REDACTED]')
    expect(result.stack).not.toContain('alice@example.com')
  })

  it('preserves the error subclass and its own fields', () => {
    class HttpError extends Error {
      constructor(
        message: string,
        readonly status: number,
      ) {
        super(message)
        this.name = 'HttpError'
      }
    }
    const result = scrub({ error: new HttpError('boom', 503) }).error as HttpError

    expect(result).toBeInstanceOf(HttpError)
    expect(result.name).toBe('HttpError')
    expect(result.status).toBe(503)
    expect(result.message).toBe('boom')
  })

  it('keeps message and stack non-enumerable, so JSON output is unchanged', () => {
    const result = scrub({ error: new Error('x') }).error as Error
    expect(Object.keys(result)).not.toContain('message')
    expect(JSON.stringify(result)).toBe('{}')
  })

  it('redacts a sensitive path inside an error object', () => {
    const error = Object.assign(new Error('nope'), { password: 'hunter2' })
    const result = scrub({ error }) as { error: Error & { password: string } }
    expect(result.error.password).toBe(REDACTED)
    expect(result.error.message).toBe('nope')
  })

  it('passes a Date through intact', () => {
    const date = new Date('2020-01-02T03:04:05.000Z')
    const result = scrub({ at: date }).at as Date

    expect(result).toBeInstanceOf(Date)
    expect(result.toISOString()).toBe('2020-01-02T03:04:05.000Z')
    expect(JSON.stringify({ at: result })).toBe('{"at":"2020-01-02T03:04:05.000Z"}')
  })

  it('preserves Map contents and scrubs its values', () => {
    const result = scrub({ m: new Map([['note', 'ip 1.2.3.4']]) }).m as Map<string, string>

    expect(result).toBeInstanceOf(Map)
    expect(result.get('note')).toBe('ip [IP_REDACTED]')
  })

  it('redacts sensitive Map keys', () => {
    const result = scrub({ m: new Map([['password', 'hunter2']]) }).m as Map<string, string>
    expect(result.get('password')).toBe(REDACTED)
  })

  it('preserves non-string Map keys', () => {
    const key = { id: 1 }
    const result = scrub({ m: new Map<unknown, unknown>([[key, 'a@b.com']]) }).m as Map<unknown, unknown>
    expect(result.get(key)).toBe('[EMAIL_REDACTED]')
  })

  it('preserves Set contents and scrubs its members', () => {
    const result = scrub({ s: new Set(['a@b.com', 'plain']) }).s as Set<string>

    expect(result).toBeInstanceOf(Set)
    expect(Array.from(result)).toEqual(['[EMAIL_REDACTED]', 'plain'])
  })

  it('preserves a class instance prototype and scrubs its fields', () => {
    class User {
      constructor(
        readonly email: string,
        readonly bio: string,
      ) {}
      get label(): string {
        return this.email
      }
    }
    const result = scrub({ user: new User('a@b.com', 'reach me at c@d.com') }).user as User

    expect(result).toBeInstanceOf(User)
    expect(result.email).toBe(REDACTED) // matched by the `*.email` path
    expect(result.bio).toBe('reach me at [EMAIL_REDACTED]')
  })

  it('preserves a null-prototype object', () => {
    const headers = Object.assign(Object.create(null) as Record<string, string>, {
      cookie: 'session=1',
      host: 'a@b.com',
    })
    const result = scrub({ headers }).headers as Record<string, string>

    expect(Object.getPrototypeOf(result)).toBeNull()
    expect(result.cookie).toBe(REDACTED)
    expect(result.host).toBe('[EMAIL_REDACTED]')
  })

  it('passes a RegExp through intact', () => {
    const re = /a@b\.com/g
    expect(scrub({ re }).re).toBe(re)
  })

  it('passes typed arrays and buffers through intact', () => {
    const bytes = new Uint8Array([1, 2, 3])
    const result = scrub({ bytes }).bytes as Uint8Array

    expect(result).toBe(bytes)
    expect(Array.from(result)).toEqual([1, 2, 3])
  })

  it('does not mutate a non-plain input', () => {
    const error = new Error('failed for alice@example.com')
    scrub({ error })
    expect(error.message).toBe('failed for alice@example.com')
  })
})

describe('exports', () => {
  it('exposes non-empty defaults', () => {
    expect(DEFAULT_REDACT_PATHS.length).toBeGreaterThan(0)
    expect(DEFAULT_SCRUB_PATTERNS.length).toBeGreaterThan(0)
  })

  it('the default scrubber uses the default paths and patterns', () => {
    const scrub = createScrubber()
    expect(scrub({ password: 'p', note: 'a@b.com' })).toEqual({ password: REDACTED, note: '[EMAIL_REDACTED]' })
  })
})
