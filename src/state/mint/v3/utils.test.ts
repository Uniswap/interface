import { Token } from '@uniswap/sdk-core'
import { tryParsePrice } from './utils'

describe('hooks', () => {
  describe('#tryParsePrice', () => {
    it('should return undefined if amount is not a number', () => {
      const baseToken = new Token(1, '0x6b175474e89094c44da98b954eedeac495271d0f', 6)
      const quoteToken = new Token(1, '0x1b175474e89094c44da98b954eedeac495271d0f', 6)

      expect(tryParsePrice(undefined, undefined, undefined)).toBeUndefined()
      expect(tryParsePrice(baseToken, quoteToken)).toBeUndefined()
      expect(tryParsePrice(baseToken, quoteToken, '')).toBeUndefined()
    })

    it('should return a price', () => {
      const baseToken = new Token(1, '0x6b175474e89094c44da98b954eedeac495271d0f', 6)
      const quoteToken = new Token(1, '0x1b175474e89094c44da98b954eedeac495271d0f', 6)

      expect(tryParsePrice(baseToken, quoteToken, '20')?.toSignificant(6)).toEqual('20')
      expect(tryParsePrice(baseToken, quoteToken, '20.05')?.toSignificant(6)).toEqual('20.05')
      expect(tryParsePrice(baseToken, quoteToken, '20.123456789')?.toSignificant(6)).toEqual('20.1235')
      expect(tryParsePrice(baseToken, quoteToken, '0.123456789')?.toSignificant(6)).toEqual('0.123457')
      expect(tryParsePrice(baseToken, quoteToken, '.123456789')?.toSignificant(6)).toEqual('0.123457')
    })
  })
})
