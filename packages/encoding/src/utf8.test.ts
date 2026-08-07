import { describe, expect, it } from 'vitest'
import { uint8ToUtf8, utf8ToUint8 } from './utf8'

describe('utf8ToUint8', () => {
  it('encodes an empty string to an empty array', () => {
    expect(utf8ToUint8('')).toEqual(new Uint8Array())
  })

  it('encodes ASCII as single-byte code units', () => {
    expect(utf8ToUint8('hello')).toEqual(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]))
  })

  it('encodes multi-byte code points (é is 2 bytes, € is 3 bytes)', () => {
    expect(utf8ToUint8('é')).toEqual(new Uint8Array([0xc3, 0xa9]))
    expect(utf8ToUint8('€')).toEqual(new Uint8Array([0xe2, 0x82, 0xac]))
  })

  it('encodes astral-plane code points via surrogate pairs (😀 is 4 bytes)', () => {
    expect(utf8ToUint8('😀')).toEqual(new Uint8Array([0xf0, 0x9f, 0x98, 0x80]))
  })
})

describe('uint8ToUtf8', () => {
  it('decodes an empty array to an empty string', () => {
    expect(uint8ToUtf8(new Uint8Array())).toBe('')
  })

  it('decodes multi-byte sequences back to their code points', () => {
    expect(uint8ToUtf8(new Uint8Array([0xe2, 0x82, 0xac]))).toBe('€')
    expect(uint8ToUtf8(new Uint8Array([0xf0, 0x9f, 0x98, 0x80]))).toBe('😀')
  })

  it('replaces invalid byte sequences with U+FFFD rather than throwing', () => {
    // 0x80 is a lone continuation byte — invalid as a standalone sequence.
    expect(uint8ToUtf8(new Uint8Array([0x80]))).toBe('�')
  })
})

// New helpers replaced ad-hoc `new TextEncoder().encode(...)` /
// `new TextDecoder().decode(...)` calls scattered across the monorepo. The
// removed implementations are reproduced here and checked against the new
// helpers across a range of fixtures to catch regressions.

function textEncode(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

function bufferEncode(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'utf8'))
}

function textDecode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

function bufferDecode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('utf8')
}

const STRING_FIXTURES: { name: string; value: string }[] = [
  { name: 'empty', value: '' },
  { name: 'ASCII', value: 'hello world' },
  { name: 'hashcash-style subject:nonce:counter', value: 'did:key:abc123:9f8e7d:42' },
  { name: 'JSON payload', value: '{"sub":"user","exp":1700000000}' },
  { name: 'accented latin (2-byte)', value: 'café crème brûlée' },
  { name: 'CJK (3-byte)', value: '你好世界こんにちは' },
  { name: 'emoji with surrogate pairs (4-byte)', value: '🚀🦄😀👨‍👩‍👧‍👦' },
  { name: 'mixed scripts and whitespace', value: 'a é € 😀\n\ttab' },
]

describe('utf8ToUint8 parity', () => {
  describe.each(STRING_FIXTURES)('$name', ({ value }) => {
    it('matches new TextEncoder().encode(value)', () => {
      expect(utf8ToUint8(value)).toEqual(textEncode(value))
    })

    it('matches new Uint8Array(Buffer.from(value, "utf8"))', () => {
      expect(utf8ToUint8(value)).toEqual(bufferEncode(value))
    })
  })
})

describe('uint8ToUtf8 parity', () => {
  describe.each(STRING_FIXTURES)('$name', ({ value }) => {
    const bytes = utf8ToUint8(value)

    it('matches new TextDecoder().decode(bytes)', () => {
      expect(uint8ToUtf8(bytes)).toBe(textDecode(bytes))
    })

    it('matches Buffer.from(bytes).toString("utf8")', () => {
      expect(uint8ToUtf8(bytes)).toBe(bufferDecode(bytes))
    })

    it('round-trips back to the original string', () => {
      expect(uint8ToUtf8(bytes)).toBe(value)
    })
  })
})
