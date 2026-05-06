import { describe, expect, it } from 'vitest'
import { base64ToUint8, uint8ToBase64 } from './base64'

describe('uint8ToBase64', () => {
  it('encodes an empty array to an empty string', () => {
    expect(uint8ToBase64(new Uint8Array())).toBe('')
  })

  it('encodes ASCII bytes matching btoa output', () => {
    const bytes = new TextEncoder().encode('hello')
    expect(uint8ToBase64(bytes)).toBe('aGVsbG8=')
  })

  it('encodes high bytes (0x80 and above) without mangling them', () => {
    // Plain String.fromCharCode handles the full 0-255 range — regressions
    // here usually show up as TextDecoder-style multi-byte reinterpretation.
    const bytes = new Uint8Array([0x00, 0x7f, 0x80, 0xff])
    expect(uint8ToBase64(bytes)).toBe('AH+A/w==')
  })

  it('produces correct padding at each length mod 3', () => {
    expect(uint8ToBase64(new Uint8Array([0x61]))).toBe('YQ==')
    expect(uint8ToBase64(new Uint8Array([0x61, 0x62]))).toBe('YWI=')
    expect(uint8ToBase64(new Uint8Array([0x61, 0x62, 0x63]))).toBe('YWJj')
  })
})

describe('base64ToUint8', () => {
  it('decodes an empty string to an empty array', () => {
    expect(base64ToUint8('')).toEqual(new Uint8Array())
  })

  it('decodes ASCII base64 back to the original bytes', () => {
    expect(base64ToUint8('aGVsbG8=')).toEqual(new TextEncoder().encode('hello'))
  })

  it('decodes high bytes correctly', () => {
    expect(base64ToUint8('AH+A/w==')).toEqual(new Uint8Array([0x00, 0x7f, 0x80, 0xff]))
  })
})
