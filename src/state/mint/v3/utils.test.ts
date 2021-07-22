import { Token } from '@uniswap/sdk-core'
import { tryParseAmountToPrice } from './utils'

describe('hooks', () => {
  describe('#tryParseTick', () => {
    it('should return undefined if amount is not a number or 0', () => {
      const baseToken = new Token(1, '0x6b175474e89094c44da98b954eedeac495271d0f', 6)
      const quoteToken = new Token(1, '0x1b175474e89094c44da98b954eedeac495271d0f', 6)

      expect(tryParseAmountToPrice(undefined, undefined, undefined)).toBeUndefined()
      expect(tryParseAmountToPrice(baseToken, quoteToken)).toBeUndefined()
      expect(tryParseAmountToPrice(baseToken, quoteToken, '')).toBeUndefined()
    })

    it('should return a CurrencyAmount', () => {
      const baseToken = new Token(1, '0x6b175474e89094c44da98b954eedeac495271d0f', 6)
      const quoteToken = new Token(1, '0x1b175474e89094c44da98b954eedeac495271d0f', 6)

      expect(tryParseAmountToPrice(baseToken, quoteToken, '20.05')?.toSignificant(6)).toEqual('20.05')
      expect(tryParseAmountToPrice(baseToken, quoteToken, '20.123456789')?.toSignificant(6)).toEqual('20.1235')
      expect(tryParseAmountToPrice(baseToken, quoteToken, '0.123456789')?.toSignificant(6)).toEqual('0.123457')
    })
  })
})
