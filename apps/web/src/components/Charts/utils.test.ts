import { getCurrentUTCTimestamp } from '~/components/Charts/utils'

describe('getCurrentUTCTimestamp', () => {
  it('returns whole integer seconds, not a fractional value', () => {
    // Date.now() is millisecond-precision; lightweight-charts UTCTimestamp must be an integer second.
    vi.spyOn(Date, 'now').mockReturnValue(1781279676509)

    const result = getCurrentUTCTimestamp()

    expect(result).toBe(1781279676)
    expect(Number.isInteger(result)).toBe(true)
  })
})
