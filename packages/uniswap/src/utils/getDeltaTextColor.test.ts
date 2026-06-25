import { DEFAULT_DELTA_COLOR, getDeltaTextColor } from 'uniswap/src/utils/getDeltaTextColor'

describe('getDeltaTextColor', () => {
  it('returns success for a positive delta', () => {
    expect(getDeltaTextColor(1)).toBe('$statusSuccess')
  })

  it('returns critical for a negative delta', () => {
    expect(getDeltaTextColor(-1)).toBe('$statusCritical')
  })

  it('returns the neutral default for a zero delta', () => {
    expect(getDeltaTextColor(0)).toBe(DEFAULT_DELTA_COLOR)
  })

  it('returns the neutral default for an absent delta', () => {
    expect(getDeltaTextColor(undefined)).toBe(DEFAULT_DELTA_COLOR)
  })
})
