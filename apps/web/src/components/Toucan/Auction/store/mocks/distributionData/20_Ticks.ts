import { FAKE_AUCTION_DATA } from 'components/Toucan/Auction/store/mockData'
import { BidDistributionData } from 'components/Toucan/Auction/store/types'

const TICK_SIZE = FAKE_AUCTION_DATA.tickSize

// 20 ticks - clearing price at $5.00
// Realistic orderbook: tight clustering above clearing price with descending volume
export const MOCK_BID_DISTRIBUTION_DATA_20_TICKS: BidDistributionData = new Map([
  // Below clearing price - random distribution (30%)
  [(Number(TICK_SIZE) * 2).toString(), '20000000000'], // $1.00
  [(Number(TICK_SIZE) * 4).toString(), '15000000000'], // $2.00
  [(Number(TICK_SIZE) * 6).toString(), '20000000000'], // $3.00
  [(Number(TICK_SIZE) * 7).toString(), '10000000000'], // $3.50
  [(Number(TICK_SIZE) * 8).toString(), '20000000000'], // $4.00
  [(Number(TICK_SIZE) * 9).toString(), '18000000000'], // $4.50
  // At and above clearing price - tight clustering with descending volume (70%)
  [(Number(TICK_SIZE) * 10).toString(), '65000000000'], // $5.00 - clearing price (highest volume)
  [(Number(TICK_SIZE) * 11).toString(), '50000000000'], // $5.50
  [(Number(TICK_SIZE) * 12).toString(), '50000000000'], // $6.00
  [(Number(TICK_SIZE) * 13).toString(), '45000000000'], // $6.50
  [(Number(TICK_SIZE) * 14).toString(), '45000000000'], // $7.00
  [(Number(TICK_SIZE) * 15).toString(), '40000000000'], // $7.50
  [(Number(TICK_SIZE) * 16).toString(), '35000000000'], // $8.00
  [(Number(TICK_SIZE) * 17).toString(), '30000000000'], // $8.50
  [(Number(TICK_SIZE) * 18).toString(), '25000000000'], // $9.00
  [(Number(TICK_SIZE) * 19).toString(), '20000000000'], // $9.50
  [(Number(TICK_SIZE) * 20).toString(), '15000000000'], // $10.00
  [(Number(TICK_SIZE) * 22).toString(), '10000000000'], // $11.00
  [(Number(TICK_SIZE) * 24).toString(), '5000000000'], // $12.00
  [(Number(TICK_SIZE) * 30).toString(), '1000000000'], // $15.00 - outlier
])
