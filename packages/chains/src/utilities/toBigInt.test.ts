import { BigNumber } from '@ethersproject/bignumber'
import { describe, expect, it } from 'vitest'
import { toBigInt } from './createToBigInt'

// Migration safety for `BigNumber.from(x).toBigInt()` (the legacy round-trip)
// and `BigInt(x)` (the target). Lives in chains so future BigNumber -> bigint
// migrations have a single place to check/extend parity assertions.
describe('BigNumber.from(x).toBigInt() vs BigInt(x)', () => {
  it.each([
    ['decimal string', '1000'],
    ['hex string', '0x1f'],
    ['zero decimal string', '0'],
    ['large decimal string', '79228162514264337593543950336'],
    ['number', 42],
    ['zero number', 0],
    ['bigint', 1000n],
    ['negative number', -5],
  ] as const)('agree on %s', (_label, input) => {
    expect(BigNumber.from(input).toBigInt()).toEqual(BigInt(input))
  })
})

// `.toString()` on both produces the same decimal string
describe('.toString() decimal output', () => {
  it.each([
    ['decimal string', '1000'],
    ['hex string', '0x1f'],
    ['zero', '0'],
    ['large value', '79228162514264337593543950336'],
    ['negative', -5],
  ] as const)('agree on %s', (_label, input) => {
    expect(BigNumber.from(input).toString()).toEqual(BigInt(input).toString())
  })
})

// BigNumber.from(x).add(sum)` -> `BigInt(x) + sum`.
describe('addition: BigNumber.add() vs bigint +', () => {
  it.each([
    ['zero + zero', '0', '0'],
    ['decimal strings', '1000', '2500'],
    ['large + small', '79228162514264337593543950336', '1'],
    ['mixed types', '1000', 42],
  ] as const)('agree on %s', (_label, a, b) => {
    expect(BigNumber.from(a).add(b).toBigInt()).toEqual(BigInt(a) + BigInt(b))
  })
})

// `bn.isZero()` vs `=== 0n`
describe('zero-check: BigNumber.isZero() / .eq(0) vs === 0n', () => {
  it.each([
    ['zero decimal', '0', true],
    ['zero hex', '0x0', true],
    ['one', '1', false],
    ['large value', '79228162514264337593543950336', false],
  ] as const)('agree on %s', (_label, input, expected) => {
    expect(BigNumber.from(input).isZero()).toEqual(expected)
    expect(BigNumber.from(input).eq(0)).toEqual(expected)
    expect(BigInt(input) === 0n).toEqual(expected)
  })
})

// `bn.toHexString()` (zero-padded to even hex digits) vs
// `'0x' + bigint.toString(16)` (no padding). The string-level
// shapes differ,but ethers `BigNumber.from()` parses both to the
// same numerical value, so downstream ABI encoding is identical.
describe('hex string: BigNumber.toHexString() vs `0x${bigint.toString(16)}`', () => {
  it.each([
    [0n, '0x00', '0x0'],
    [1n, '0x01', '0x1'],
    [15n, '0x0f', '0xf'],
    [16n, '0x10', '0x10'],
    [255n, '0xff', '0xff'],
    [256n, '0x0100', '0x100'],
  ] as const)('value %s: BigNumber yields %s, bigint yields %s', (input, expectedBn, expectedBi) => {
    expect(BigNumber.from(input).toHexString()).toEqual(expectedBn)
    expect(`0x${input.toString(16)}`).toEqual(expectedBi)
    // Both round-trip to the same BigNumber via `from()`
    expect(BigNumber.from(expectedBn).toBigInt()).toEqual(BigNumber.from(expectedBi).toBigInt())
  })
})

// `bn.gt(0)` vs `> 0n`
describe('positivity: BigNumber.gt(0) vs > 0n', () => {
  it.each([
    ['zero', '0', false],
    ['one', '1', true],
    ['large value', '79228162514264337593543950336', true],
  ] as const)('agree on %s', (_label, input, expected) => {
    expect(BigNumber.from(input).gt(0)).toEqual(expected)
    expect(BigInt(input) > 0n).toEqual(expected)
  })
})

// Simple math we want to confirm
describe('MAX_UINT128 constant', () => {
  it('legacy expression equals bigint expression', () => {
    // oxlint-disable-next-line no-bitwise
    expect(BigNumber.from(2).pow(128).sub(1).toBigInt()).toEqual((1n << 128n) - 1n)
  })
})

// `toBigInt` accepts the full BigNumberish union
// (including BigNumber objects that `BigInt(...)` would reject).
describe('toBigInt accepts all BigNumberish inputs', () => {
  it.each([
    ['decimal string', '1000', 1000n],
    ['hex string', '0x1f', 31n],
    ['number', 42, 42n],
    ['zero number', 0, 0n],
    ['bigint', 1000n, 1000n],
    ['negative number', -5, -5n],
  ] as const)('primitive: %s', (_label, input, expected) => {
    expect(toBigInt(input)).toEqual(expected)
  })

  it.each([
    ['BigNumber.from(0)', BigNumber.from(0), 0n],
    ['BigNumber.from(10)', BigNumber.from(10), 10n],
    ['BigNumber.from(large)', BigNumber.from('79228162514264337593543950336'), 79228162514264337593543950336n],
  ] as const)('BigNumber object: %s', (_label, input, expected) => {
    expect(toBigInt(input)).toEqual(expected)
  })

  it('returns bigint inputs directly without conversion', () => {
    const input = 12345n
    expect(toBigInt(input)).toBe(input)
  })
})

// `x.mul(120).div(100)` -> `(x * 120n) / 100n`. (mul/division)
// Both floor-truncate toward zero on positive integers (gas estimates are
// always positive), so the result matches exactly for the realistic range.
describe('gas-margin: BigNumber mul().div() vs bigint * /', () => {
  it.each([
    ['zero', '0'],
    ['one', '1'],
    ['small', '50'],
    ['typical gas estimate', '210000'],
    ['large gas estimate', '15000000'],
    ['precision-loss boundary', '7'],
  ] as const)('agree on %s', (_label, input) => {
    expect(BigNumber.from(input).mul(120).div(100).toBigInt()).toEqual((BigInt(input) * 120n) / 100n)
  })
})
