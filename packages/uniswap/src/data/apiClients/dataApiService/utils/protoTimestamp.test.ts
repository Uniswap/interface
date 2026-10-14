import { Timestamp } from '@bufbuild/protobuf'
import { timestampToMs } from 'uniswap/src/data/apiClients/dataApiService/utils/protoTimestamp'

describe(timestampToMs, () => {
  it('converts seconds and nanos to milliseconds', () => {
    expect(timestampToMs({ seconds: 1_788_600_000n, nanos: 500_000_000 })).toBe(1_788_600_000_500)
    expect(timestampToMs(Timestamp.fromDate(new Date('2026-09-04T16:00:00Z')))).toBe(
      new Date('2026-09-04T16:00:00Z').getTime(),
    )
  })

  it('returns undefined for an unset or zero timestamp', () => {
    expect(timestampToMs(undefined)).toBeUndefined()
    expect(timestampToMs({ seconds: 0n, nanos: 0 })).toBeUndefined()
  })
})
