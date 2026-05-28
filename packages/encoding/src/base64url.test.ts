import { describe, expect, it } from 'vitest'
import { base64ToUint8, uint8ToBase64 } from './base64'
import { base64ToBase64url, base64urlToBase64 } from './base64url'

describe('base64urlToBase64', () => {
  it('returns an empty string unchanged', () => {
    expect(base64urlToBase64('')).toBe('')
  })

  it('swaps - and _ back to + and /', () => {
    // '+/' encodes to '-_' in base64url
    expect(base64urlToBase64('-_')).toBe('+/==')
    expect(base64urlToBase64('-_-_')).toBe('+/+/')
  })

  it('re-adds padding for each length mod 4', () => {
    // len % 4 === 0: no padding
    expect(base64urlToBase64('YWJj')).toBe('YWJj')
    // len % 4 === 2: 2 '=' pads
    expect(base64urlToBase64('YQ')).toBe('YQ==')
    // len % 4 === 3: 1 '=' pad
    expect(base64urlToBase64('YWI')).toBe('YWI=')
  })

  it('leaves already-padded input padding intact', () => {
    // If the input already has '=' pads (unusual for base64url but
    // possible), we should not add more — length mod 4 is already 0.
    expect(base64urlToBase64('YQ==')).toBe('YQ==')
  })
})

describe('base64ToBase64url', () => {
  it('returns an empty string unchanged', () => {
    expect(base64ToBase64url('')).toBe('')
  })

  it('swaps + and / to - and _', () => {
    expect(base64ToBase64url('+/+/')).toBe('-_-_')
  })

  it('strips trailing padding', () => {
    expect(base64ToBase64url('YQ==')).toBe('YQ')
    expect(base64ToBase64url('YWI=')).toBe('YWI')
    expect(base64ToBase64url('YWJj')).toBe('YWJj')
  })
})

// New helpers replaced several ad-hoc implementations scattered across the
// monorepo. The removed implementations are reproduced here and checked
// against the new helpers across a range of fixtures to catch regressions.

// Notable for skipping `=` padding entirely; `atob` accepts unpadded input,
// so this must agree byte-for-byte with `base64urlToBase64` + `base64ToUint8`.
function unpaddedBase64UrlDecode(b64url: string): Uint8Array {
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

const DECODE_FIXTURES: { name: string; bytes: Uint8Array }[] = [
  { name: 'empty', bytes: new Uint8Array() },
  { name: '1 byte (b64url len mod 4 = 2)', bytes: new Uint8Array([0x61]) },
  { name: '2 bytes (b64url len mod 4 = 3)', bytes: new Uint8Array([0x61, 0x62]) },
  { name: '3 bytes (b64url len mod 4 = 0)', bytes: new Uint8Array([0x61, 0x62, 0x63]) },
  { name: 'low/high byte boundaries', bytes: new Uint8Array([0x00, 0x7f, 0x80, 0xff]) },
  { name: 'full 0-255 byte range', bytes: new Uint8Array(Array.from({ length: 256 }, (_, i) => i)) },
  {
    name: '1 KiB pseudo-random buffer',
    // oxlint-disable-next-line no-bitwise
    bytes: new Uint8Array(Array.from({ length: 1024 }, (_, i) => (i * 31 + 7) & 0xff)),
  },
]

describe('unpaddedBase64UrlDecode parity', () => {
  describe.each(DECODE_FIXTURES)('$name', ({ bytes }) => {
    const b64url = base64ToBase64url(uint8ToBase64(bytes))

    it('matches the legacy base64UrlDecode that skipped `=` padding', () => {
      expect(base64ToUint8(base64urlToBase64(b64url))).toEqual(unpaddedBase64UrlDecode(b64url))
    })
  })
})
