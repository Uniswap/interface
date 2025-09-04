import { Token } from '@uniswap/sdk-core'
import { getTokenPageTitle } from 'pages/TokenDetails/utils'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import i18n from 'uniswap/src/i18n'

describe('pages/TokenDetails/util', () => {
  describe('getTokenPageTitle', () => {
    it('should return the correct title when tokenName and tokenSymbol are undefined', () => {
      const result = getTokenPageTitle({ t: i18n.t, currency: new Token(1, ZERO_ADDRESS, 18) })
      expect(result).toBe('Buy and sell on Uniswap')
    })

    it('should return the correct title when only tokenName is defined', () => {
      const result = getTokenPageTitle({
        t: i18n.t,
        currency: new Token(1, ZERO_ADDRESS, 18, undefined, 'Baby Doge Token'),
      })
      expect(result).toBe('Baby Doge Token: Buy and sell on Uniswap')
    })

    it('should return the correct title when only tokenSymbol is defined', () => {
      const result = getTokenPageTitle({
        t: i18n.t,
        currency: new Token(1, ZERO_ADDRESS, 18, 'BDT', undefined),
      })
      expect(result).toBe('BDT: Buy and sell on Uniswap')
    })

    it('should return the correct title when tokenName and tokenSymbol are defined', () => {
      const result = getTokenPageTitle({
        t: i18n.t,
        currency: new Token(1, ZERO_ADDRESS, 18, 'BDT', 'Baby Doge Token'),
      })
      expect(result).toBe('Baby Doge Token (BDT): Buy and sell on Uniswap')
    })
  })
})
