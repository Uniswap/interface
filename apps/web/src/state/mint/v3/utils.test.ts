import { Token } from '@uniswap/sdk-core'
import { tryParsePrice } from 'state/mint/v3/utils'
import { DAI } from 'uniswap/src/constants/tokens'

describe('hooks', () => {
  describe('#tryParsePrice', () => {
    it('should return undefined if amount is not a number', () => {
      const baseToken = DAI
      const quoteToken = new Token(1, '0x1b175474e89094c44da98b954eedeac495271d0f', 6)

      expect(tryParsePrice({ baseToken, quoteToken, value: undefined })).toBeUndefined()
      expect(tryParsePrice({ baseToken, quoteToken })).toBeUndefined()
      expect(tryParsePrice({ baseToken, quoteToken, value: '' })).toBeUndefined()
      expect(tryParsePrice({ baseToken, quoteToken, value: 'abc.123' })).toBeUndefined()
      expect(tryParsePrice({ baseToken, quoteToken, value: '1.2.3' })).toBeUndefined()
    })

    it('should return a price when decimals are the same', () => {
      const baseToken = DAI
      const quoteToken = new Token(1, '0x1b175474e89094c44da98b954eedeac495271d0f', 6)

      expect(tryParsePrice({ baseToken, quoteToken, value: '20' })?.toSignificant(6)).toEqual('20')
      expect(tryParsePrice({ baseToken, quoteToken, value: '20.05' })?.toSignificant(6)).toEqual('20.05')
      expect(tryParsePrice({ baseToken, quoteToken, value: '20.123456789' })?.toSignificant(6)).toEqual('20.1235')
      expect(tryParsePrice({ baseToken, quoteToken, value: '0.123456789' })?.toSignificant(6)).toEqual('0.123457')
      expect(tryParsePrice({ baseToken, quoteToken, value: '.123456789' })?.toSignificant(6)).toEqual('0.123457')
      expect(tryParsePrice({ baseToken, quoteToken, value: '20.' })?.toSignificant(6)).toEqual('20')
      expect(
        tryParsePrice({
          baseToken,
          quoteToken,
          value: (2 ** 128).toLocaleString('fullwide', { useGrouping: false }),
        })?.toSignificant(6),
      ).toEqual('340282000000000000000000000000000000000')
      expect(
        tryParsePrice({
          baseToken,
          quoteToken,
          value: /* ~2^-128 */ '0.000000000000000000000000000587747',
        })?.toSignificant(6),
      ).toEqual('0.000000000000000000000000000587747')
    })

    it('should return a price when decimals are different', () => {
      const baseToken = DAI
      const quoteToken = new Token(1, '0x1b175474e89094c44da98b954eedeac495271d0f', 4)

      expect(tryParsePrice({ baseToken, quoteToken, value: '20' })?.toSignificant(6)).toEqual('20')
      expect(tryParsePrice({ baseToken, quoteToken, value: '20.' })?.toSignificant(6)).toEqual('20')
      expect(tryParsePrice({ baseToken, quoteToken, value: '20.05' })?.toSignificant(6)).toEqual('20.05')
      expect(tryParsePrice({ baseToken, quoteToken, value: '20.123456789' })?.toSignificant(6)).toEqual('20.1235')
      expect(tryParsePrice({ baseToken, quoteToken, value: '0.123456789' })?.toSignificant(6)).toEqual('0.123457')
      expect(tryParsePrice({ baseToken, quoteToken, value: '.123456789' })?.toSignificant(6)).toEqual('0.123457')
      expect(
        tryParsePrice({
          baseToken,
          quoteToken,
          value: (2 ** 128).toLocaleString('fullwide', { useGrouping: false }),
        })?.toSignificant(6),
      ).toEqual('340282000000000000000000000000000000000')
      expect(
        tryParsePrice({
          baseToken,
          quoteToken,
          value: /* ~2^-128 */ '0.000000000000000000000000000587747',
        })?.toSignificant(6),
      ).toEqual('0.000000000000000000000000000587747')
    })

    it('should parse very small prices', () => {
      const value = '5.063825133252633e-9'
      const baseToken = DAI
      const quoteToken = new Token(1, '0x1b175474e89094c44da98b954eedeac495271d0f', 6)
      expect(tryParsePrice({ baseToken, quoteToken, value })?.toSignificant(6)).toEqual('0.00000000506383')
    })
  })
})
