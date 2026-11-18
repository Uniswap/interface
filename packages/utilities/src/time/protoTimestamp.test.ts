import { timestampToMs, timestampToSeconds } from 'utilities/src/time/protoTimestamp'

describe(timestampToMs, () => {
  it('converts seconds and nanos to milliseconds', () => {
    expect(timestampToMs({ seconds: 1_788_600_000n, nanos: 500_000_000 })).toBe(1_788_600_000_500)
    expect(timestampToMs({ seconds: 1_788_537_600n, nanos: 0 })).toBe(new Date('2026-09-04T16:00:00Z').getTime())
  })

  it('rounds sub-millisecond nanos up', () => {
    expect(timestampToMs({ seconds: 1n, nanos: 1 })).toBe(1001)
  })

  it('returns undefined for an unset or zero timestamp', () => {
    expect(timestampToMs(undefined)).toBeUndefined()
    expect(timestampToMs({ seconds: 0n, nanos: 0 })).toBeUndefined()
  })
})

describe(timestampToSeconds, () => {
  it('converts to whole seconds', () => {
    expect(timestampToSeconds({ seconds: 1_002_000n, nanos: 999_999_999 })).toBe(1_002_000n)
    expect(timestampToSeconds(undefined)).toBeUndefined()
  })
})
