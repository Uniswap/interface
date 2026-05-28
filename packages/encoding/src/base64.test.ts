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

// New helpers replaced several ad-hoc implementations scattered across the
// monorepo. The removed implementations are reproduced here and checked
// against the new helpers across a range of fixtures to catch regressions.

function bufferEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}

function spreadEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function bufferDecode(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'))
}

function fromAtobDecode(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

function reverseLoopDecode(b64: string): Uint8Array {
  const bstr = atob(b64)
  let n = bstr.length
  const u8 = new Uint8Array(n)
  while (n--) {
    u8[n] = bstr.charCodeAt(n)
  }
  return u8
}

function forwardLoopDecode(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

const ENCODE_FIXTURES: { name: string; bytes: Uint8Array }[] = [
  { name: 'empty', bytes: new Uint8Array() },
  { name: '1 byte (mod-3 length 1, double padding)', bytes: new Uint8Array([0x61]) },
  { name: '2 bytes (mod-3 length 2, single padding)', bytes: new Uint8Array([0x61, 0x62]) },
  { name: '3 bytes (mod-3 length 0, no padding)', bytes: new Uint8Array([0x61, 0x62, 0x63]) },
  { name: 'low/high byte boundaries', bytes: new Uint8Array([0x00, 0x7f, 0x80, 0xff]) },
  { name: 'full 0-255 byte range', bytes: new Uint8Array(Array.from({ length: 256 }, (_, i) => i)) },
  {
    name: '1 KiB pseudo-random buffer',
    // oxlint-disable-next-line no-bitwise
    bytes: new Uint8Array(Array.from({ length: 1024 }, (_, i) => (i * 31 + 7) & 0xff)),
  },
]

describe('uint8ToBase64 parity', () => {
  describe.each(ENCODE_FIXTURES)('$name', ({ bytes }) => {
    it('matches Buffer.from(bytes).toString("base64")', () => {
      expect(uint8ToBase64(bytes)).toBe(bufferEncode(bytes))
    })

    it('matches btoa(String.fromCharCode(...bytes))', () => {
      expect(uint8ToBase64(bytes)).toBe(spreadEncode(bytes))
    })
  })
})

describe('base64ToUint8 parity', () => {
  describe.each(ENCODE_FIXTURES)('$name', ({ bytes }) => {
    const b64 = uint8ToBase64(bytes)

    it('matches new Uint8Array(Buffer.from(b64, "base64"))', () => {
      expect(base64ToUint8(b64)).toEqual(bufferDecode(b64))
    })

    it('matches Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))', () => {
      expect(base64ToUint8(b64)).toEqual(fromAtobDecode(b64))
    })

    it('matches the reverse-loop atob decode', () => {
      expect(base64ToUint8(b64)).toEqual(reverseLoopDecode(b64))
    })

    it('matches the forward-loop atob decode', () => {
      expect(base64ToUint8(b64)).toEqual(forwardLoopDecode(b64))
    })
  })
})
