import { Trade } from '@uniswap/router-sdk'
import { CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import { Route as V3Route } from '@uniswap/v3-sdk'
import { PriceChartData } from 'components/Charts/PriceChart'
import JSBI from 'jsbi'
import { UTCTimestamp } from 'lightweight-charts'
import {
  TEST_POOL_12,
  TEST_POOL_13,
  TEST_TOKEN_1,
  TEST_TOKEN_2,
  TEST_TOKEN_3,
  toCurrencyAmount,
} from 'test-utils/constants'
import { computeRealizedLPFeeAmount, removeOutliers, warningSeverity } from 'utils/prices'

const pair12 = new Pair(
  CurrencyAmount.fromRawAmount(TEST_TOKEN_1, JSBI.BigInt(10000)),
  CurrencyAmount.fromRawAmount(TEST_TOKEN_2, JSBI.BigInt(20000)),
)
const pair23 = new Pair(
  CurrencyAmount.fromRawAmount(TEST_TOKEN_2, JSBI.BigInt(20000)),
  CurrencyAmount.fromRawAmount(TEST_TOKEN_3, JSBI.BigInt(30000)),
)

describe('prices', () => {
  describe('#computeRealizedLPFeeAmount', () => {
    it('returns undefined for undefined', () => {
      expect(computeRealizedLPFeeAmount(undefined)).toEqual(undefined)
    })

    it('correct realized lp fee for single hop on v2', () => {
      // v2
      expect(
        computeRealizedLPFeeAmount(
          new Trade({
            v2Routes: [
              {
                routev2: new V2Route([pair12], TEST_TOKEN_1, TEST_TOKEN_2),
                inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
                outputAmount: toCurrencyAmount(TEST_TOKEN_2, 1000),
              },
            ],
            v3Routes: [],
            tradeType: TradeType.EXACT_INPUT,
          }),
        ),
      ).toEqual(toCurrencyAmount(TEST_TOKEN_1, 3)) // 3% realized fee
    })

    it('correct realized lp fee for single hop on v3', () => {
      // v3
      expect(
        computeRealizedLPFeeAmount(
          new Trade({
            v3Routes: [
              {
                routev3: new V3Route([TEST_POOL_12], TEST_TOKEN_1, TEST_TOKEN_2),
                inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
                outputAmount: toCurrencyAmount(TEST_TOKEN_2, 1000),
              },
            ],
            v2Routes: [],
            tradeType: TradeType.EXACT_INPUT,
          }),
        ),
      ).toEqual(toCurrencyAmount(TEST_TOKEN_1, 10)) // 3% realized fee
    })

    it('correct realized lp fee for double hop', () => {
      expect(
        computeRealizedLPFeeAmount(
          new Trade({
            v2Routes: [
              {
                routev2: new V2Route([pair12, pair23], TEST_TOKEN_1, TEST_TOKEN_3),
                inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
                outputAmount: toCurrencyAmount(TEST_TOKEN_3, 1000),
              },
            ],
            v3Routes: [],
            tradeType: TradeType.EXACT_INPUT,
          }),
        ),
      ).toEqual(toCurrencyAmount(TEST_TOKEN_1, 5))
    })

    it('correct realized lp fee for multi route v2+v3', () => {
      expect(
        computeRealizedLPFeeAmount(
          new Trade({
            v2Routes: [
              {
                routev2: new V2Route([pair12, pair23], TEST_TOKEN_1, TEST_TOKEN_3),
                inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
                outputAmount: toCurrencyAmount(TEST_TOKEN_3, 1000),
              },
            ],
            v3Routes: [
              {
                routev3: new V3Route([TEST_POOL_13], TEST_TOKEN_1, TEST_TOKEN_3),
                inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
                outputAmount: toCurrencyAmount(TEST_TOKEN_3, 1000),
              },
            ],
            tradeType: TradeType.EXACT_INPUT,
          }),
        ),
      ).toEqual(toCurrencyAmount(TEST_TOKEN_1, 8))
    })
  })

  describe('#warningSeverity', () => {
    it('0 for undefined', () => {
      expect(warningSeverity(undefined)).toEqual(0)
    })
    it('0 for negative', () => {
      expect(warningSeverity(new Percent(-1))).toEqual(0)
    })
    it('correct for 0', () => {
      expect(warningSeverity(new Percent(0))).toEqual(0)
    })
    it('correct for 0.5', () => {
      expect(warningSeverity(new Percent(5, 1000))).toEqual(0)
    })
    it('correct for 5', () => {
      expect(warningSeverity(new Percent(5, 100))).toEqual(2)
    })
    it('correct for 50', () => {
      expect(warningSeverity(new Percent(5, 10))).toEqual(4)
    })
  })
})

describe('removeOutliers', () => {
  it('returns original array if less than 4 entries', () => {
    const data: PriceChartData[] = [
      { time: 1 as UTCTimestamp, open: 100, high: 100, low: 100, close: 100, value: 100 },
      { time: 2 as UTCTimestamp, open: 200, high: 200, low: 200, close: 200, value: 200 },
      { time: 3 as UTCTimestamp, open: 300, high: 300, low: 300, close: 300, value: 300 },
    ]
    expect(removeOutliers(data)).toEqual(data)
  })

  it('removes outliers using IQR method', () => {
    const data: PriceChartData[] = [
      { time: 1 as UTCTimestamp, open: 100, high: 100, low: 100, close: 100, value: 100 }, // Q1
      { time: 2 as UTCTimestamp, open: 150, high: 150, low: 150, close: 150, value: 150 },
      { time: 3 as UTCTimestamp, open: 200, high: 200, low: 200, close: 200, value: 200 }, // Q3
      { time: 4 as UTCTimestamp, open: 250, high: 250, low: 250, close: 250, value: 250 },
      { time: 5 as UTCTimestamp, open: 1000, high: 1000, low: 1000, close: 1000, value: 1000 }, // outlier
    ]
    const result = removeOutliers(data)
    expect(result).toHaveLength(4)
    expect(result).not.toContainEqual({ time: 5, value: 1000 })
  })

  it('handles negative outliers', () => {
    const data: PriceChartData[] = [
      { time: 1 as UTCTimestamp, open: -1000, high: -1000, low: -1000, close: -1000, value: -1000 }, // outlier
      { time: 2 as UTCTimestamp, open: 100, high: 100, low: 100, close: 100, value: 100 },
      { time: 3 as UTCTimestamp, open: 150, high: 150, low: 150, close: 150, value: 150 },
      { time: 4 as UTCTimestamp, open: 200, high: 200, low: 200, close: 200, value: 200 },
      { time: 5 as UTCTimestamp, open: 250, high: 250, low: 250, close: 250, value: 250 },
    ]
    const result = removeOutliers(data)
    expect(result).toHaveLength(4)
    expect(result).not.toContainEqual({ time: 1 as UTCTimestamp, value: -1000 })
  })

  it('preserves data points within IQR bounds', () => {
    const data: PriceChartData[] = [
      { time: 1 as UTCTimestamp, open: 100, high: 100, low: 100, close: 100, value: 100 },
      { time: 2 as UTCTimestamp, open: 150, high: 150, low: 150, close: 150, value: 150 },
      { time: 3 as UTCTimestamp, open: 200, high: 200, low: 200, close: 200, value: 200 },
      { time: 4 as UTCTimestamp, open: 250, high: 250, low: 250, close: 250, value: 250 },
      { time: 5 as UTCTimestamp, open: 300, high: 300, low: 300, close: 300, value: 300 },
    ]
    const result = removeOutliers(data)
    expect(result).toEqual(data)
  })
})
