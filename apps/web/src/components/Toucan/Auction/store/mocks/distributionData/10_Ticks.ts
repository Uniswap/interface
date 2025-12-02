import { FAKE_AUCTION_DATA } from 'components/Toucan/Auction/store/mockData'
import { BidDistributionData } from 'components/Toucan/Auction/store/types'

const TICK_SIZE = FAKE_AUCTION_DATA.tickSize

// 10 ticks clustered near clearing price ($5.00)
// Realistic orderbook: tight clustering above clearing, descending volume with distance
export const MOCK_BID_DISTRIBUTION_DATA_10_TICKS: BidDistributionData = new Map([
  // Below clearing price - random distribution (30%)
  [(Number(TICK_SIZE) * 2).toString(), '420000000'], // $1.00
  [(Number(TICK_SIZE) * 6).toString(), '380000000'], // $3.00
  [(Number(TICK_SIZE) * 8).toString(), '550000000'], // $4.00
  // At and above clearing price - tight clustering with descending volume (70%)
  [(Number(TICK_SIZE) * 10).toString(), '920000000'], // $5.00 - clearing price (highest volume)
  [(Number(TICK_SIZE) * 11).toString(), '880000000'], // $5.50
  [(Number(TICK_SIZE) * 12).toString(), '830000000'], // $6.00
  [(Number(TICK_SIZE) * 13).toString(), '740000000'], // $6.50
  [(Number(TICK_SIZE) * 14).toString(), '650000000'], // $7.00
  [(Number(TICK_SIZE) * 15).toString(), '610000000'], // $7.50
  [(Number(TICK_SIZE) * 18).toString(), '470000000'], // $9.00 - outlier
])
