import dotenv from 'dotenv'
import { describe, expect, it } from 'vitest'
import { envName, lastSegment, paramEntryToObject, serializeParams } from './format'

describe('lastSegment', () => {
  it('returns the segment after the last slash', () => {
    expect(lastSegment('/web/default/api-url')).toBe('api-url')
  })

  it('returns the input unchanged when there is no slash', () => {
    expect(lastSegment('api-url')).toBe('api-url')
  })

  it('returns an empty string when the key ends in a slash', () => {
    expect(lastSegment('/web/default/')).toBe('')
  })
})

describe('envName', () => {
  it('converts the last segment from kebab-case to UPPER_SNAKE_CASE', () => {
    expect(envName('/web/default/app-id')).toBe('APP_ID')
  })

  it('handles single-word keys', () => {
    expect(envName('/web/default/timeout')).toBe('TIMEOUT')
  })

  it('converts every dash, including consecutive ones', () => {
    expect(envName('/web/default/foo-bar-baz')).toBe('FOO_BAR_BAZ')
  })
})

describe('paramEntryToObject', () => {
  it('maps each parameter to its env-name key', () => {
    expect(
      paramEntryToObject([
        { key: '/web/default/app-id', value: 'web', author: 'a' },
        { key: '/web/default/timeout', value: '30', author: 'b' },
      ]),
    ).toEqual({ APP_ID: 'web', TIMEOUT: '30' })
  })

  it('skips entries with no key — they would otherwise overwrite each other under an empty name', () => {
    expect(
      paramEntryToObject([{ key: '/web/default/app-id', value: 'web' }, { value: 'orphan' }, { author: 'someone' }]),
    ).toEqual({ APP_ID: 'web' })
  })

  it('preserves an empty value as an empty string', () => {
    expect(paramEntryToObject([{ key: '/web/default/blank' }])).toEqual({ BLANK: '' })
  })
})

describe('serializeParams', () => {
  it('emits KEY="value" lines with a trailing newline', () => {
    expect(serializeParams({ APP_ID: 'web', TIMEOUT: '30' })).toBe('APP_ID="web"\nTIMEOUT="30"\n')
  })

  it('returns an empty string for an empty record', () => {
    expect(serializeParams({})).toBe('')
  })

  it('round-trips multi-line values through dotenv.parse (the certificate case)', () => {
    // NOTE: dotenv 16.0.3 only decodes `\n` and `\r` inside double-quoted values — it does
    // NOT decode `\\` or `\"`. So values containing backslashes or double quotes do not
    // round-trip cleanly through the writer + dotenv.parse pair. The pull --no-overwrite
    // merge path uses dotenv.parse, so that's a latent edge case for affected values.
    const original = { CERT: 'line1\nline2', URL: 'https://example.com', NUM: '30' }
    expect(dotenv.parse(serializeParams(original))).toEqual(original)
  })
})
