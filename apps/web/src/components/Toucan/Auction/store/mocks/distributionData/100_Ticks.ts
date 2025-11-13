import { FAKE_AUCTION_DATA } from 'components/Toucan/Auction/store/mockData'
import { BidDistributionData } from 'components/Toucan/Auction/store/types'

const TICK_SIZE = FAKE_AUCTION_DATA.tickSize

// 100 ticks - clearing price at $5.00
// Realistic orderbook: very tight clustering above clearing price with exponential volume decay
export const MOCK_BID_DISTRIBUTION_DATA_100_TICKS: BidDistributionData = new Map([
  // Below clearing price - random distribution (30 ticks)
  [(Number(TICK_SIZE) * 2).toString(), '150000000'], // $1.00
  [(Number(TICK_SIZE) * 3).toString(), '120000000'], // $1.50
  [(Number(TICK_SIZE) * 4).toString(), '180000000'], // $2.00
  [(Number(TICK_SIZE) * 5).toString(), '95000000'], // $2.50
  [(Number(TICK_SIZE) * 6).toString(), '140000000'], // $3.00
  [(Number(TICK_SIZE) * 7).toString(), '110000000'], // $3.50
  [(Number(TICK_SIZE) * 8).toString(), '160000000'], // $4.00
  [(Number(TICK_SIZE) * 9).toString(), '130000000'], // $4.50
  // At clearing price - highest volume
  [(Number(TICK_SIZE) * 10).toString(), '2600000000'], // $5.00 - clearing price
  // Above clearing - very tight clustering (70 ticks concentrated near clearing)
  [(Number(TICK_SIZE) * 11).toString(), '2550000000'], // $5.50
  [(Number(TICK_SIZE) * 12).toString(), '2520000000'], // $6.00
  [(Number(TICK_SIZE) * 13).toString(), '2500000000'], // $6.50
  [(Number(TICK_SIZE) * 14).toString(), '2480000000'], // $7.00
  [(Number(TICK_SIZE) * 15).toString(), '2460000000'], // $7.50
  [(Number(TICK_SIZE) * 16).toString(), '2440000000'], // $8.00
  [(Number(TICK_SIZE) * 17).toString(), '2420000000'], // $8.50
  [(Number(TICK_SIZE) * 18).toString(), '2400000000'], // $9.00
  [(Number(TICK_SIZE) * 19).toString(), '2380000000'], // $9.50
  [(Number(TICK_SIZE) * 20).toString(), '2360000000'], // $10.00
  [(Number(TICK_SIZE) * 21).toString(), '2340000000'], // $10.50
  [(Number(TICK_SIZE) * 22).toString(), '2320000000'], // $11.00
  [(Number(TICK_SIZE) * 23).toString(), '2300000000'], // $11.50
  [(Number(TICK_SIZE) * 24).toString(), '2280000000'], // $12.00
  [(Number(TICK_SIZE) * 25).toString(), '2260000000'], // $12.50
  [(Number(TICK_SIZE) * 26).toString(), '2240000000'], // $13.00
  [(Number(TICK_SIZE) * 27).toString(), '2220000000'], // $13.50
  [(Number(TICK_SIZE) * 28).toString(), '2200000000'], // $14.00
  [(Number(TICK_SIZE) * 29).toString(), '2180000000'], // $14.50
  [(Number(TICK_SIZE) * 30).toString(), '2160000000'], // $15.00
  [(Number(TICK_SIZE) * 31).toString(), '2140000000'], // $15.50
  [(Number(TICK_SIZE) * 32).toString(), '2120000000'], // $16.00
  [(Number(TICK_SIZE) * 33).toString(), '2100000000'], // $16.50
  [(Number(TICK_SIZE) * 34).toString(), '2070000000'], // $17.00
  [(Number(TICK_SIZE) * 35).toString(), '2040000000'], // $17.50
  [(Number(TICK_SIZE) * 36).toString(), '2010000000'], // $18.00
  [(Number(TICK_SIZE) * 37).toString(), '1980000000'], // $18.50
  [(Number(TICK_SIZE) * 38).toString(), '1950000000'], // $19.00
  [(Number(TICK_SIZE) * 39).toString(), '1920000000'], // $19.50
  [(Number(TICK_SIZE) * 40).toString(), '1890000000'], // $20.00
  [(Number(TICK_SIZE) * 41).toString(), '1860000000'], // $20.50
  [(Number(TICK_SIZE) * 42).toString(), '1830000000'], // $21.00
  [(Number(TICK_SIZE) * 43).toString(), '1800000000'], // $21.50
  [(Number(TICK_SIZE) * 44).toString(), '1770000000'], // $22.00
  [(Number(TICK_SIZE) * 45).toString(), '1740000000'], // $22.50
  [(Number(TICK_SIZE) * 46).toString(), '1710000000'], // $23.00
  [(Number(TICK_SIZE) * 47).toString(), '1680000000'], // $23.50
  [(Number(TICK_SIZE) * 48).toString(), '1650000000'], // $24.00
  [(Number(TICK_SIZE) * 49).toString(), '1620000000'], // $24.50
  [(Number(TICK_SIZE) * 50).toString(), '1590000000'], // $25.00
  [(Number(TICK_SIZE) * 51).toString(), '1560000000'], // $25.50
  [(Number(TICK_SIZE) * 52).toString(), '1530000000'], // $26.00
  [(Number(TICK_SIZE) * 53).toString(), '1500000000'], // $26.50
  [(Number(TICK_SIZE) * 54).toString(), '1470000000'], // $27.00
  [(Number(TICK_SIZE) * 55).toString(), '1440000000'], // $27.50
  [(Number(TICK_SIZE) * 56).toString(), '1410000000'], // $28.00
  [(Number(TICK_SIZE) * 57).toString(), '1380000000'], // $28.50
  [(Number(TICK_SIZE) * 58).toString(), '1350000000'], // $29.00
  [(Number(TICK_SIZE) * 59).toString(), '1320000000'], // $29.50
  [(Number(TICK_SIZE) * 60).toString(), '1290000000'], // $30.00
  [(Number(TICK_SIZE) * 61).toString(), '1260000000'], // $30.50
  [(Number(TICK_SIZE) * 62).toString(), '1230000000'], // $31.00
  [(Number(TICK_SIZE) * 63).toString(), '1200000000'], // $31.50
  [(Number(TICK_SIZE) * 64).toString(), '1170000000'], // $32.00
  [(Number(TICK_SIZE) * 65).toString(), '1140000000'], // $32.50
  [(Number(TICK_SIZE) * 66).toString(), '1110000000'], // $33.00
  [(Number(TICK_SIZE) * 67).toString(), '1080000000'], // $33.50
  [(Number(TICK_SIZE) * 68).toString(), '1050000000'], // $34.00
  [(Number(TICK_SIZE) * 69).toString(), '1020000000'], // $34.50
  [(Number(TICK_SIZE) * 70).toString(), '990000000'], // $35.00
  [(Number(TICK_SIZE) * 71).toString(), '960000000'], // $35.50
  [(Number(TICK_SIZE) * 72).toString(), '930000000'], // $36.00
  [(Number(TICK_SIZE) * 73).toString(), '900000000'], // $36.50
  [(Number(TICK_SIZE) * 74).toString(), '870000000'], // $37.00
  [(Number(TICK_SIZE) * 75).toString(), '840000000'], // $37.50
  [(Number(TICK_SIZE) * 76).toString(), '810000000'], // $38.00
  [(Number(TICK_SIZE) * 77).toString(), '780000000'], // $38.50
  [(Number(TICK_SIZE) * 78).toString(), '750000000'], // $39.00
  [(Number(TICK_SIZE) * 79).toString(), '720000000'], // $39.50
  [(Number(TICK_SIZE) * 80).toString(), '690000000'], // $40.00
  [(Number(TICK_SIZE) * 82).toString(), '660000000'], // $41.00
  [(Number(TICK_SIZE) * 84).toString(), '630000000'], // $42.00
  [(Number(TICK_SIZE) * 86).toString(), '600000000'], // $43.00
  [(Number(TICK_SIZE) * 88).toString(), '570000000'], // $44.00
  [(Number(TICK_SIZE) * 90).toString(), '540000000'], // $45.00
  [(Number(TICK_SIZE) * 92).toString(), '510000000'], // $46.00
  [(Number(TICK_SIZE) * 94).toString(), '480000000'], // $47.00
  [(Number(TICK_SIZE) * 96).toString(), '450000000'], // $48.00
  [(Number(TICK_SIZE) * 98).toString(), '420000000'], // $49.00
  [(Number(TICK_SIZE) * 100).toString(), '390000000'], // $50.00
  [(Number(TICK_SIZE) * 105).toString(), '350000000'], // $52.50
  [(Number(TICK_SIZE) * 110).toString(), '320000000'], // $55.00
  [(Number(TICK_SIZE) * 115).toString(), '290000000'], // $57.50
  [(Number(TICK_SIZE) * 120).toString(), '260000000'], // $60.00
  // Outliers - rare bids far from clearing
  [(Number(TICK_SIZE) * 140).toString(), '220000000'], // $70.00
  [(Number(TICK_SIZE) * 160).toString(), '180000000'], // $80.00
  [(Number(TICK_SIZE) * 200).toString(), '140000000'], // $100.00
  [(Number(TICK_SIZE) * 250).toString(), '100000000'], // $125.00
  [(Number(TICK_SIZE) * 300).toString(), '80000000'], // $150.00
])
