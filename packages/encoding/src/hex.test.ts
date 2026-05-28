import { describe, expect, it } from 'vitest'
import { ensure0xHex, hexToNumber, hexToUint8, isValidHexString, numberToHex, uint8ToHex } from './hex'

describe('uint8ToHex', () => {
  it('encodes an empty array to an empty string', () => {
    expect(uint8ToHex(new Uint8Array())).toBe('')
  })

  it('encodes ASCII bytes to lowercase hex without 0x prefix', () => {
    expect(uint8ToHex(new TextEncoder().encode('hello'))).toBe('68656c6c6f')
  })

  it('zero-pads single-digit bytes', () => {
    expect(uint8ToHex(new Uint8Array([0x00, 0x01, 0x0f, 0x10]))).toBe('00010f10')
  })

  it('encodes the full 0-255 byte range', () => {
    const bytes = new Uint8Array(Array.from({ length: 256 }, (_, i) => i))
    expect(uint8ToHex(bytes)).toBe(Buffer.from(bytes).toString('hex'))
  })
})

describe('hexToUint8', () => {
  it('decodes an empty string to an empty array', () => {
    expect(hexToUint8('')).toEqual(new Uint8Array())
  })

  it('decodes a hex string back to the original bytes', () => {
    expect(hexToUint8('68656c6c6f')).toEqual(new TextEncoder().encode('hello'))
  })

  it('strips a leading 0x prefix', () => {
    expect(hexToUint8('0x68656c6c6f')).toEqual(new TextEncoder().encode('hello'))
  })

  it('accepts uppercase hex digits', () => {
    expect(hexToUint8('DEADBEEF')).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))
  })

  it('throws on odd-length input', () => {
    expect(() => hexToUint8('abc')).toThrow(/odd length/)
  })

  it('throws on non-hex characters', () => {
    expect(() => hexToUint8('zzzz')).toThrow(/non-hex/)
  })
})

describe('numberToHex', () => {
  it('encodes 0 as 0x0', () => {
    expect(numberToHex(0)).toBe('0x0')
  })

  it('encodes positive integers in lowercase', () => {
    expect(numberToHex(1)).toBe('0x1')
    expect(numberToHex(15)).toBe('0xf')
    expect(numberToHex(255)).toBe('0xff')
    expect(numberToHex(1_000_000)).toBe('0xf4240')
  })
})

describe('hexToNumber', () => {
  it('parses a 0x-prefixed hex string', () => {
    expect(hexToNumber('0xff')).toBe(255)
  })

  it('parses a hex string without prefix', () => {
    expect(hexToNumber('ff')).toBe(255)
  })

  it('round-trips with numberToHex', () => {
    for (const n of [0, 1, 15, 255, 1_000_000, 0x7fffffff]) {
      expect(hexToNumber(numberToHex(n))).toBe(n)
    }
  })
})

describe('ensure0xHex', () => {
  it('adds 0x to an unprefixed string', () => {
    expect(ensure0xHex('abc')).toBe('0xabc')
  })

  it('leaves an already-prefixed string unchanged', () => {
    expect(ensure0xHex('0xabc')).toBe('0xabc')
  })

  it('adds 0x to an arbitrary non-hex string', () => {
    expect(ensure0xHex('yz')).toBe('0xyz')
  })
})

describe('isValidHexString', () => {
  it('accepts 0x-prefixed lowercase and uppercase hex', () => {
    expect(isValidHexString('0xabc')).toBe(true)
    expect(isValidHexString('0xABC')).toBe(true)
    expect(isValidHexString('0xDeAdBeEf')).toBe(true)
  })

  it('rejects unprefixed hex', () => {
    expect(isValidHexString('abc')).toBe(false)
  })

  it('rejects non-hex characters', () => {
    expect(isValidHexString('0xzz')).toBe(false)
  })

  it('rejects bare 0x without digits', () => {
    expect(isValidHexString('0x')).toBe(false)
  })
})

// The helpers replace several ad-hoc implementations scattered across the
// monorepo. The removed implementations are reproduced here and checked
// against the new helpers across a range of fixtures.

function bufferToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex')
}

function loopToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function bufferFromHex(hex: string): Uint8Array {
  const stripped = hex.startsWith('0x') ? hex.slice(2) : hex
  return new Uint8Array(Buffer.from(stripped, 'hex'))
}

// Hand-rolled loop matching the form moved from contenthashToUri.ts: strips
// 0x, requires even length, and parses each pair of hex digits via parseInt.
function manualLoopFromHex(hex: string): Uint8Array {
  const stripped = hex.startsWith('0x') ? hex.slice(2) : hex
  const arr = new Uint8Array(stripped.length / 2)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(stripped.substr(i * 2, 2), 16)
  }
  return arr
}

const HEX_FIXTURES: { name: string; bytes: Uint8Array }[] = [
  { name: 'empty', bytes: new Uint8Array() },
  { name: '1 byte', bytes: new Uint8Array([0x61]) },
  { name: '2 bytes', bytes: new Uint8Array([0x00, 0xff]) },
  { name: 'low/high byte boundaries', bytes: new Uint8Array([0x00, 0x0f, 0x10, 0x7f, 0x80, 0xff]) },
  { name: 'full 0-255 byte range', bytes: new Uint8Array(Array.from({ length: 256 }, (_, i) => i)) },
  {
    name: '1 KiB pseudo-random buffer',
    // oxlint-disable-next-line no-bitwise
    bytes: new Uint8Array(Array.from({ length: 1024 }, (_, i) => (i * 31 + 7) & 0xff)),
  },
]

describe('uint8ToHex parity', () => {
  describe.each(HEX_FIXTURES)('$name', ({ bytes }) => {
    it('matches Buffer.from(bytes).toString("hex")', () => {
      expect(uint8ToHex(bytes)).toBe(bufferToHex(bytes))
    })

    it('matches the .toString(16).padStart(2, "0") loop', () => {
      expect(uint8ToHex(bytes)).toBe(loopToHex(bytes))
    })
  })
})

describe('hexToUint8 parity', () => {
  describe.each(HEX_FIXTURES)('$name', ({ bytes }) => {
    const hex = uint8ToHex(bytes)

    it('matches new Uint8Array(Buffer.from(hex, "hex"))', () => {
      expect(hexToUint8(hex)).toEqual(bufferFromHex(hex))
    })

    it('matches the hand-rolled parseInt(hex.substr(i*2, 2), 16) loop', () => {
      expect(hexToUint8(hex)).toEqual(manualLoopFromHex(hex))
      expect(hexToUint8(`0x${hex}`)).toEqual(manualLoopFromHex(`0x${hex}`))
    })

    it('round-trips through 0x-prefixed form', () => {
      expect(hexToUint8(`0x${hex}`)).toEqual(bytes)
    })
  })
})

const NUMBER_FIXTURES: number[] = [
  0, 1, 15, 16, 255, 256, 1_000_000,
  // Common EVM chain ids
  1, 10, 137, 8453, 42161,
  // Max safe-ish range used in chain id contexts
  0x7fffffff,
]

describe('numberToHex parity', () => {
  it.each(NUMBER_FIXTURES)('matches `0x${n.toString(16)}` for %i', (n) => {
    expect(numberToHex(n)).toBe(`0x${n.toString(16)}`)
  })
})

describe('hexToNumber parity', () => {
  it.each(NUMBER_FIXTURES)('matches parseInt(hex, 16) for %i (with 0x)', (n) => {
    const hex = `0x${n.toString(16)}`
    expect(hexToNumber(hex)).toBe(parseInt(hex, 16))
  })

  it.each(NUMBER_FIXTURES)('matches parseInt(hex, 16) for %i (without 0x)', (n) => {
    const hex = n.toString(16)
    expect(hexToNumber(hex)).toBe(parseInt(hex, 16))
  })
})
