import { calculateInitialVisibleRange } from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'

describe('calculateInitialVisibleRange', () => {
  it('should anchor around clearing price when clearing price is within data range', () => {
    const range = calculateInitialVisibleRange({
      clearingPrice: 3,
      minTick: 1,
      maxTick: 5,
      tickSize: 1,
      initialTickCount: 2,
    })

    // One tick before clearing price, then 2 ticks to the right (clamped to maxTick).
    expect(range.from).toBe(2)
    expect(range.to).toBe(4)
  })

  it('should anchor to minTick when clearing price is outside the data range', () => {
    const minTick = 0.0012
    const maxTick = 1.9022

    const range = calculateInitialVisibleRange({
      clearingPrice: 10, // far outside [minTick, maxTick]
      minTick,
      maxTick,
      tickSize: 0.1,
      initialTickCount: 20,
    })

    expect(range.from).toBe(minTick)
    expect(range.to).toBe(maxTick) // clamped to maxTick
  })
})
