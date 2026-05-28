import { BANNED_PINS, validatePin } from 'uniswap/src/features/passkey/pinValidation'
import { describe, expect, it } from 'vitest'

describe('validatePin', () => {
  it('rejects non-numeric input', () => {
    expect(validatePin('abcd')).toEqual({ valid: false, reason: 'non_numeric' })
    expect(validatePin('12ab')).toEqual({ valid: false, reason: 'non_numeric' })
  })

  it('rejects wrong length', () => {
    expect(validatePin('123')).toEqual({ valid: false, reason: 'invalid_length' })
    expect(validatePin('12345')).toEqual({ valid: false, reason: 'invalid_length' })
    expect(validatePin('')).toEqual({ valid: false, reason: 'invalid_length' })
  })

  it('rejects banned PINs', () => {
    expect(validatePin('1234')).toEqual({ valid: false, reason: 'banned' })
    expect(validatePin('0000')).toEqual({ valid: false, reason: 'banned' })
    expect(validatePin('1111')).toEqual({ valid: false, reason: 'banned' })
  })

  it('accepts valid PINs', () => {
    expect(validatePin('8294')).toEqual({ valid: true })
    expect(validatePin('6031')).toEqual({ valid: true })
  })

  it('BANNED_PINS contains common PINs', () => {
    expect(BANNED_PINS.has('1234')).toBe(true)
    expect(BANNED_PINS.has('0000')).toBe(true)
    expect(BANNED_PINS.has('1111')).toBe(true)
    expect(BANNED_PINS.has('2580')).toBe(true)
    expect(BANNED_PINS.size).toBeGreaterThanOrEqual(20)
  })
})
