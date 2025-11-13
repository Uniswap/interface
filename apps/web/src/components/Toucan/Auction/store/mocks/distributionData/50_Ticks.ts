import { FAKE_AUCTION_DATA } from 'components/Toucan/Auction/store/mockData'
import { BidDistributionData } from 'components/Toucan/Auction/store/types'

const TICK_SIZE = FAKE_AUCTION_DATA.tickSize

// 50 ticks - clearing price at $5.00
// Realistic orderbook: tight clustering above clearing price with exponential decay in volume
export const MOCK_BID_DISTRIBUTION_DATA_50_TICKS: BidDistributionData = new Map([
  // Below clearing price - random distribution (30%)
  [(Number(TICK_SIZE) * 2).toString(), '120000000'], // $1.00
  [(Number(TICK_SIZE) * 3).toString(), '95000000'], // $1.50
  [(Number(TICK_SIZE) * 4).toString(), '110000000'], // $2.00
  [(Number(TICK_SIZE) * 5).toString(), '80000000'], // $2.50
  [(Number(TICK_SIZE) * 6).toString(), '90000000'], // $3.00
  [(Number(TICK_SIZE) * 7).toString(), '85000000'], // $3.50
  [(Number(TICK_SIZE) * 8).toString(), '100000000'], // $4.00
  [(Number(TICK_SIZE) * 9).toString(), '95000000'], // $4.50
  // At clearing price - highest volume
  [(Number(TICK_SIZE) * 10).toString(), '2800000000'], // $5.00 - clearing price
  // Above clearing price - tight clustering with descending volume
  [(Number(TICK_SIZE) * 11).toString(), '2700000000'], // $5.50
  [(Number(TICK_SIZE) * 12).toString(), '2650000000'], // $6.00
  [(Number(TICK_SIZE) * 13).toString(), '2600000000'], // $6.50
  [(Number(TICK_SIZE) * 14).toString(), '2550000000'], // $7.00
  [(Number(TICK_SIZE) * 15).toString(), '2500000000'], // $7.50
  [(Number(TICK_SIZE) * 16).toString(), '2450000000'], // $8.00
  [(Number(TICK_SIZE) * 17).toString(), '2400000000'], // $8.50
  [(Number(TICK_SIZE) * 18).toString(), '2350000000'], // $9.00
  [(Number(TICK_SIZE) * 19).toString(), '2300000000'], // $9.50
  [(Number(TICK_SIZE) * 20).toString(), '2250000000'], // $10.00
  [(Number(TICK_SIZE) * 21).toString(), '2200000000'], // $10.50
  [(Number(TICK_SIZE) * 22).toString(), '2150000000'], // $11.00
  [(Number(TICK_SIZE) * 23).toString(), '2100000000'], // $11.50
  [(Number(TICK_SIZE) * 24).toString(), '2050000000'], // $12.00
  [(Number(TICK_SIZE) * 25).toString(), '1950000000'], // $12.50
  [(Number(TICK_SIZE) * 26).toString(), '1850000000'], // $13.00
  [(Number(TICK_SIZE) * 27).toString(), '1750000000'], // $13.50
  [(Number(TICK_SIZE) * 28).toString(), '1650000000'], // $14.00
  [(Number(TICK_SIZE) * 29).toString(), '1550000000'], // $14.50
  [(Number(TICK_SIZE) * 30).toString(), '1450000000'], // $15.00
  [(Number(TICK_SIZE) * 31).toString(), '1350000000'], // $15.50
  [(Number(TICK_SIZE) * 32).toString(), '1250000000'], // $16.00
  [(Number(TICK_SIZE) * 33).toString(), '1150000000'], // $16.50
  [(Number(TICK_SIZE) * 34).toString(), '1050000000'], // $17.00
  [(Number(TICK_SIZE) * 35).toString(), '950000000'], // $17.50
  [(Number(TICK_SIZE) * 36).toString(), '850000000'], // $18.00
  [(Number(TICK_SIZE) * 37).toString(), '750000000'], // $18.50
  [(Number(TICK_SIZE) * 38).toString(), '650000000'], // $19.00
  [(Number(TICK_SIZE) * 40).toString(), '550000000'], // $20.00
  [(Number(TICK_SIZE) * 42).toString(), '450000000'], // $21.00
  [(Number(TICK_SIZE) * 44).toString(), '380000000'], // $22.00
  [(Number(TICK_SIZE) * 46).toString(), '320000000'], // $23.00
  [(Number(TICK_SIZE) * 48).toString(), '280000000'], // $24.00
  [(Number(TICK_SIZE) * 52).toString(), '240000000'], // $26.00
  [(Number(TICK_SIZE) * 56).toString(), '200000000'], // $28.00
  [(Number(TICK_SIZE) * 60).toString(), '180000000'], // $30.00
  // Outliers
  [(Number(TICK_SIZE) * 70).toString(), '150000000'], // $35.00
  [(Number(TICK_SIZE) * 90).toString(), '120000000'], // $45.00
  [(Number(TICK_SIZE) * 120).toString(), '100000000'], // $60.00
  [(Number(TICK_SIZE) * 180).toString(), '80000000'], // $90.00
])
