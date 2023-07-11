import { Token } from '@thinkincoin-libs/sdk-core'

import { tryParsePrice } from './utils'

describe('hooks', () => {
  describe('#tryParsePrice', () => {
    it('should return undefined if amount is not a number', () => {
      const baseToken = new Token(1, '0x6b175474e89094c44da98b954eedeac495271d0f', 6)
      const quoteToken = new Token(1, '0x1b175474e89094c44da98b954eedeac495271d0f', 6)

      expect(tryParsePrice(undefined, undefined, undefined)).toBeUndefined()
      expect(tryParsePrice(baseToken, quoteToken)).toBeUndefined()
      expect(tryParsePrice(baseToken, quoteToken, '')).toBeUndefined()
      expect(tryParsePrice(baseToken, quoteToken, 'abc.123')).toBeUndefined()
      expect(tryParsePrice(baseToken, quoteToken, '1.2.3')).toBeUndefined()
      expect(tryParsePrice(baseToken, quoteToken, '20.')).toEqual(undefined)
    })

    it('should return a price when decimals are the same', () => {
      const baseToken = new Token(1, '0x6b175474e89094c44da98b954eedeac495271d0f', 6)
      const quoteToken = new Token(1, '0x1b175474e89094c44da98b954eedeac495271d0f', 6)

      expect(tryParsePrice(baseToken, quoteToken, '20')?.toSignificant(6)).toEqual('20')
      expect(tryParsePrice(baseToken, quoteToken, '20.05')?.toSignificant(6)).toEqual('20.05')
      expect(tryParsePrice(baseToken, quoteToken, '20.123456789')?.toSignificant(6)).toEqual('20.1235')
      expect(tryParsePrice(baseToken, quoteToken, '0.123456789')?.toSignificant(6)).toEqual('0.123457')
      expect(tryParsePrice(baseToken, quoteToken, '.123456789')?.toSignificant(6)).toEqual('0.123457')
      expect(
        tryParsePrice(
          baseToken,
          quoteToken,
          (2 ** 128).toLocaleString('fullwide', { useGrouping: false })
        )?.toSignificant(6)
      ).toEqual('340282000000000000000000000000000000000')
      expect(
        tryParsePrice(baseToken, quoteToken, /* ~2^-128 */ '0.000000000000000000000000000587747')?.toSignificant(6)
      ).toEqual('0.000000000000000000000000000587747')
    })

    it('should return a price when decimals are different', () => {
      const baseToken = new Token(1, '0x6b175474e89094c44da98b954eedeac495271d0f', 2)
      const quoteToken = new Token(1, '0x1b175474e89094c44da98b954eedeac495271d0f', 4)

      expect(tryParsePrice(baseToken, quoteToken, '20')?.toSignificant(6)).toEqual('20')
      expect(tryParsePrice(baseToken, quoteToken, '20.05')?.toSignificant(6)).toEqual('20.05')
      expect(tryParsePrice(baseToken, quoteToken, '20.123456789')?.toSignificant(6)).toEqual('20.1235')
      expect(tryParsePrice(baseToken, quoteToken, '0.123456789')?.toSignificant(6)).toEqual('0.123457')
      expect(tryParsePrice(baseToken, quoteToken, '.123456789')?.toSignificant(6)).toEqual('0.123457')
      expect(
        tryParsePrice(
          baseToken,
          quoteToken,
          (2 ** 128).toLocaleString('fullwide', { useGrouping: false })
        )?.toSignificant(6)
      ).toEqual('340282000000000000000000000000000000000')
      expect(
        tryParsePrice(baseToken, quoteToken, /* ~2^-128 */ '0.000000000000000000000000000587747')?.toSignificant(6)
      ).toEqual('0.000000000000000000000000000587747')
    })
  })
})
