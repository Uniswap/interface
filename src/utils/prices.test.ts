import { Trade } from '@uniswap/router-sdk'
import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'

import { computeRealizedLPFeeAmount, warningSeverity } from './prices'

const token1 = new Token(1, '0x0000000000000000000000000000000000000001', 18)
const token2 = new Token(1, '0x0000000000000000000000000000000000000002', 18)
const token3 = new Token(1, '0x0000000000000000000000000000000000000003', 18)

const pair12 = new Pair(
  CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(10000)),
  CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(20000))
)
const pair23 = new Pair(
  CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(20000)),
  CurrencyAmount.fromRawAmount(token3, JSBI.BigInt(30000))
)

const pool12 = new Pool(token1, token2, FeeAmount.HIGH, '2437312313659959819381354528', '10272714736694327408', -69633)
const pool13 = new Pool(
  token1,
  token3,
  FeeAmount.MEDIUM,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)

const currencyAmount = (token: Token, amount: number) => CurrencyAmount.fromRawAmount(token, JSBI.BigInt(amount))

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
                routev2: new V2Route([pair12], token1, token2),
                inputAmount: currencyAmount(token1, 1000),
                outputAmount: currencyAmount(token2, 1000),
              },
            ],
            v3Routes: [],
            tradeType: TradeType.EXACT_INPUT,
          })
        )
      ).toEqual(currencyAmount(token1, 3)) // 3% realized fee
    })

    it('correct realized lp fee for single hop on v3', () => {
      // v3
      expect(
        computeRealizedLPFeeAmount(
          new Trade({
            v3Routes: [
              {
                routev3: new V3Route([pool12], token1, token2),
                inputAmount: currencyAmount(token1, 1000),
                outputAmount: currencyAmount(token2, 1000),
              },
            ],
            v2Routes: [],
            tradeType: TradeType.EXACT_INPUT,
          })
        )
      ).toEqual(currencyAmount(token1, 10)) // 3% realized fee
    })

    it('correct realized lp fee for double hop', () => {
      expect(
        computeRealizedLPFeeAmount(
          new Trade({
            v2Routes: [
              {
                routev2: new V2Route([pair12, pair23], token1, token3),
                inputAmount: currencyAmount(token1, 1000),
                outputAmount: currencyAmount(token3, 1000),
              },
            ],
            v3Routes: [],
            tradeType: TradeType.EXACT_INPUT,
          })
        )
      ).toEqual(currencyAmount(token1, 5))
    })

    it('correct realized lp fee for multi route v2+v3', () => {
      expect(
        computeRealizedLPFeeAmount(
          new Trade({
            v2Routes: [
              {
                routev2: new V2Route([pair12, pair23], token1, token3),
                inputAmount: currencyAmount(token1, 1000),
                outputAmount: currencyAmount(token3, 1000),
              },
            ],
            v3Routes: [
              {
                routev3: new V3Route([pool13], token1, token3),
                inputAmount: currencyAmount(token1, 1000),
                outputAmount: currencyAmount(token3, 1000),
              },
            ],
            tradeType: TradeType.EXACT_INPUT,
          })
        )
      ).toEqual(currencyAmount(token1, 8))
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
