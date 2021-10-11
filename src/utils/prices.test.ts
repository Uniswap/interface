import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Pair, Route, Trade } from '@uniswap/v2-sdk'
import JSBI from 'jsbi'

import { computeRealizedLPFeeAmount, warningSeverity } from './prices'

describe('prices', () => {
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

  describe('#computeRealizedLPFeeAmount', () => {
    it('returns undefined for undefined', () => {
      expect(computeRealizedLPFeeAmount(undefined)).toEqual(undefined)
    })

    it('correct realized lp fee for single hop', () => {
      expect(
        computeRealizedLPFeeAmount(
          new Trade(
            new Route([pair12], token1, token2),
            CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(1000)),
            TradeType.EXACT_INPUT
          )
        )
      ).toEqual(CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(3)))
    })

    it('correct realized lp fee for double hop', () => {
      expect(
        computeRealizedLPFeeAmount(
          new Trade(
            new Route([pair12, pair23], token1, token3),
            CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(1000)),
            TradeType.EXACT_INPUT
          )
        )
      ).toEqual(CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(5)))
    })
  })

  describe('#warningSeverity', () => {
    it('max for undefined', () => {
      expect(warningSeverity(undefined)).toEqual(4)
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
