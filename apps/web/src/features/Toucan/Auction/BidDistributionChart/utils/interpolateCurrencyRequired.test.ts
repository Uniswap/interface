import { TickDetail } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { interpolateCurrencyRequiredQ96 } from '~/features/Toucan/Auction/BidDistributionChart/utils/interpolateCurrencyRequired'

function makeTick(priceQ96: string, currencyRequiredQ96: string): TickDetail {
  return new TickDetail({
    priceQ96,
    currencyRequiredQ96,
    currencyDemandQ96: '0',
    requiredCurrencyDemandQ96: '0',
    isInitialized: true,
  })
}

describe('interpolateCurrencyRequiredQ96', () => {
  it('returns null for an empty tick array', () => {
    expect(interpolateCurrencyRequiredQ96({ ticks: [], tickQ96: '100' })).toBeNull()
  })

  it('returns null when ticks is null', () => {
    expect(interpolateCurrencyRequiredQ96({ ticks: null, tickQ96: '100' })).toBeNull()
  })

  it('returns null when ticks is undefined', () => {
    expect(interpolateCurrencyRequiredQ96({ ticks: undefined, tickQ96: '100' })).toBeNull()
  })

  it('returns the exact tick value when the target matches a single initialized tick', () => {
    const ticks = [makeTick('100', '500')]
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: '100' })).toBe('500')
  })

  it('returns null with a single tick when target does not match (cannot interpolate)', () => {
    const ticks = [makeTick('100', '500')]
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: '150' })).toBeNull()
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: '50' })).toBeNull()
  })

  it('returns the exact tick value when the target matches an initialized tick', () => {
    const ticks = [makeTick('100', '500'), makeTick('200', '1500'), makeTick('300', '3000')]
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: '200' })).toBe('1500')
  })

  it('interpolates linearly at the midpoint of two initialized ticks', () => {
    const ticks = [makeTick('100', '500'), makeTick('200', '1500')]
    // midpoint between priceQ96 100 and 200 → midpoint of currencyRequiredQ96 500 and 1500 = 1000
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: '150' })).toBe('1000')
  })

  it('interpolates at an arbitrary fraction between two initialized ticks', () => {
    const ticks = [makeTick('100', '500'), makeTick('200', '1500')]
    // 25% of the way from 100 to 200 → 500 + 0.25 * (1500 - 500) = 750
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: '125' })).toBe('750')
  })

  it('interpolates within the correct adjacent pair across a multi-tick array', () => {
    const ticks = [makeTick('100', '500'), makeTick('200', '1500'), makeTick('300', '3000')]
    // 250 falls between 200 and 300: 1500 + 0.5 * (3000 - 1500) = 2250
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: '250' })).toBe('2250')
  })

  it('returns null when the target is below the first initialized tick', () => {
    const ticks = [makeTick('100', '500'), makeTick('200', '1500')]
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: '50' })).toBeNull()
  })

  it('returns null when the target is above the last initialized tick', () => {
    const ticks = [makeTick('100', '500'), makeTick('200', '1500')]
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: '250' })).toBeNull()
  })

  it('handles a large gap between adjacent initialized ticks', () => {
    const ticks = [makeTick('0', '0'), makeTick('1000000', '100000000')]
    // at priceQ96 1, value = 0 + (1 * 100000000) / 1000000 = 100
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: '1' })).toBe('100')
  })

  it('handles Q96-scale BigInt values without precision loss', () => {
    // 2^96 values (Q96)
    const Q96 = 2n ** 96n
    const ticks = [
      makeTick((Q96 * 100n).toString(), (Q96 * 10n).toString()),
      makeTick((Q96 * 200n).toString(), (Q96 * 30n).toString()),
    ]
    // at priceQ96 = Q96 * 150 (midpoint) → Q96 * 20
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: (Q96 * 150n).toString() })).toBe((Q96 * 20n).toString())
  })

  it('returns null when priceQ96 is not a valid BigInt', () => {
    const ticks = [makeTick('100', '500'), makeTick('200', '1500')]
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: 'not-a-number' })).toBeNull()
  })

  it('returns null when adjacent ticks share the same priceQ96 (zero denominator)', () => {
    const ticks = [makeTick('100', '500'), makeTick('100', '1500')]
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: '100' })).toBe('500')
    // Target below min → null even though duplicate exists at min
    expect(interpolateCurrencyRequiredQ96({ ticks, tickQ96: '99' })).toBeNull()
  })
})
