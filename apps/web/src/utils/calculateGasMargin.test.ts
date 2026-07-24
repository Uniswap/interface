import { BigNumber } from '@ethersproject/bignumber'
import { calculateGasMargin } from '~/utils/calculateGasMargin'

// JS BigInt division truncates toward zero (the fractional part is
// discarded, ECMA-262 `BigInt::divide`). Gas values are always positive,
// so for `(value * 120n) / 100n` truncation is equivalent to floor, which
// makes the +20% margin safe (we always round down, never overshoot).
describe('bigint division truncates toward zero', () => {
  it.each([
    [7n, 2n, 3n], // 3.5 -> 3
    [5n, 2n, 2n], // 2.5 -> 2
    [9n, 2n, 4n], // 4.5 -> 4
    [1n, 2n, 0n], // 0.5 -> 0
    // Toward zero, NOT floor behaviour
    [-7n, 2n, -3n], // -3.5 -> -3
    [-9n, 2n, -4n], // -4.5 -> -4
  ])('%s / %s = %s (bigint and BigNumber agree)', (a, b, expected) => {
    expect(a / b).toBe(expected)
    expect(BigNumber.from(a).div(BigNumber.from(b)).toBigInt()).toBe(expected)
  })
})

describe('#calculateGasMargin', () => {
  it('returns 0n for 0n', () => {
    expect(calculateGasMargin(0n)).toBe(0n)
  })

  it.each([
    [1000n, 1200n],
    [50n, 60n],
    [210000n, 252000n], // typical EVM gas estimate
    [15_000_000n, 18_000_000n], // near block-gas-limit estimate
  ])('adds 20%% to %s -> %s', (input, expected) => {
    expect(calculateGasMargin(input)).toBe(expected)
  })

  // (x * 120n) / 100n floor-truncates toward zero. For values not divisible
  // by 5 the exact +20% is fractional, so the result rounds down. This is
  // the same flooring behavior as ethers' BigNumber.mul(120).div(100).
  it.each([
    [1n, 1n], // 1.2 -> 1
    [4n, 4n], // 4.8 -> 4
    [5n, 6n], // exact
    [7n, 8n], // 8.4 -> 8
    [9n, 10n], // 10.8 -> 10
  ])('floors toward zero: %s -> %s', (input, expected) => {
    expect(calculateGasMargin(input)).toBe(expected)
  })

  it('handles values larger than Number.MAX_SAFE_INTEGER without precision loss', () => {
    const large = 2n ** 64n // beyond safe integer
    expect(calculateGasMargin(large)).toBe((large * 120n) / 100n)
  })
})
