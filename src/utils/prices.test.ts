import { ChainId, JSBI, Pair, Route, Token, TokenAmount, Trade, TradeType } from '@uniswap/sdk'
import { computeTradePriceBreakdown } from './prices'

describe('prices', () => {
  const token1 = new Token(ChainId.MAINNET, '0x0000000000000000000000000000000000000001', 18)
  const token2 = new Token(ChainId.MAINNET, '0x0000000000000000000000000000000000000002', 18)
  const token3 = new Token(ChainId.MAINNET, '0x0000000000000000000000000000000000000003', 18)

  const pair12 = new Pair(new TokenAmount(token1, JSBI.BigInt(10000)), new TokenAmount(token2, JSBI.BigInt(20000)))
  const pair23 = new Pair(new TokenAmount(token2, JSBI.BigInt(20000)), new TokenAmount(token3, JSBI.BigInt(30000)))

  describe('computeTradePriceBreakdown', () => {
    it('returns undefined for undefined', () => {
      expect(computeTradePriceBreakdown(undefined)).toEqual({
        priceImpactWithoutFee: undefined,
        realizedLPFee: undefined
      })
    })

    it('correct realized lp fee for single hop', () => {
      expect(
        computeTradePriceBreakdown(
          new Trade(new Route([pair12], token1), new TokenAmount(token1, JSBI.BigInt(1000)), TradeType.EXACT_INPUT)
        ).realizedLPFee
      ).toEqual(new TokenAmount(token1, JSBI.BigInt(3)))
    })

    it('correct realized lp fee for double hop', () => {
      expect(
        computeTradePriceBreakdown(
          new Trade(
            new Route([pair12, pair23], token1),
            new TokenAmount(token1, JSBI.BigInt(1000)),
            TradeType.EXACT_INPUT
          )
        ).realizedLPFee
      ).toEqual(new TokenAmount(token1, JSBI.BigInt(5)))
    })
  })
})
