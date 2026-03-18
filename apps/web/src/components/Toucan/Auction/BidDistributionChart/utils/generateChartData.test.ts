import { MAX_RENDERABLE_BARS } from '~/components/Toucan/Auction/BidDistributionChart/constants'
import { calculateTickQ96, rawAmountToQ96 } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { generateChartData } from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'

describe('generateChartData (demand mode)', () => {
  it('includes out-of-window bids in cumulative volumes', () => {
    const bidTokenInfo = { symbol: 'TEST', decimals: 18, priceFiat: 1, isStablecoin: false, logoUrl: null }
    const auctionTokenDecimals = 18

    const unitRaw = 10n ** 18n
    const floorPriceQ96 = rawAmountToQ96(unitRaw, 18).toString()
    const tickSizeQ96 = rawAmountToQ96(unitRaw, 18).toString()
    const clearingPriceQ96 = floorPriceQ96

    const totalTicks = MAX_RENDERABLE_BARS + 50
    const bidData = new Map<string, string>()
    const amountRaw = unitRaw.toString()

    for (let i = 0; i < totalTicks; i++) {
      const tickQ96 = calculateTickQ96({
        basePriceQ96: floorPriceQ96,
        tickSizeQ96,
        tickOffset: i,
      })
      bidData.set(tickQ96, amountRaw)
    }

    const chartData = generateChartData({
      bidData,
      bidTokenInfo,
      totalSupply: undefined,
      auctionTokenDecimals,
      clearingPrice: clearingPriceQ96,
      floorPrice: floorPriceQ96,
      tickSize: tickSizeQ96,
      formatter: (amount: number) => amount.toString(),
      chartMode: 'demand',
    })

    expect(chartData.bars.length).toBe(MAX_RENDERABLE_BARS)
    expect(chartData.totalBidVolume).toBe(totalTicks)
    expect(chartData.bars[0]?.amount).toBe(totalTicks)
    expect(chartData.bars[chartData.bars.length - 1]?.amount).toBe(51)
  })

  it('includes excluded volume in cumulative calculations', () => {
    const bidTokenInfo = { symbol: 'TEST', decimals: 18, priceFiat: 1, isStablecoin: false, logoUrl: null }
    const unitRaw = 10n ** 18n
    const floorPriceQ96 = rawAmountToQ96(unitRaw, 18).toString()
    const tickSizeQ96 = rawAmountToQ96(unitRaw, 18).toString()

    const bidData = new Map<string, string>()
    // Add just 10 ticks of bids
    for (let i = 0; i < 10; i++) {
      const tickQ96 = calculateTickQ96({
        basePriceQ96: floorPriceQ96,
        tickSizeQ96,
        tickOffset: i,
      })
      bidData.set(tickQ96, unitRaw.toString())
    }

    // Simulate 100 units of excluded volume
    const excludedVolume = (100n * unitRaw).toString()

    const chartData = generateChartData({
      bidData,
      bidTokenInfo,
      auctionTokenDecimals: 18,
      clearingPrice: floorPriceQ96,
      floorPrice: floorPriceQ96,
      tickSize: tickSizeQ96,
      formatter: (amount: number) => amount.toString(),
      chartMode: 'demand',
      excludedVolume,
    })

    // Total should be 10 (from bidData) + 100 (excluded) = 110
    expect(chartData.totalBidVolume).toBe(110)
    // First bar (lowest tick) should have cumulative of all bids
    expect(chartData.bars[0]?.amount).toBe(110)
  })
})
