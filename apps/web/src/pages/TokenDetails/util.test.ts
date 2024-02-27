import { Token } from '@uniswap/sdk-core'
import { ZERO_ADDRESS } from 'constants/misc'
import { getTokenPageTitle } from './utils'

describe('pages/TokenDetails/util', () => {
  describe('getTokenPageTitle', () => {
    it('should return the correct title when tokenName and tokenSymbol are undefined', () => {
      const result = getTokenPageTitle(new Token(1, ZERO_ADDRESS, 18))
      expect(result).toBe('Buy, sell, and trade on Uniswap')
    })

    it('should return the correct title when only tokenName is defined', () => {
      const result = getTokenPageTitle(new Token(1, ZERO_ADDRESS, 18, undefined, 'Baby Doge Token'))
      expect(result).toBe('Baby Doge Token: Buy, sell, and trade on Uniswap')
    })

    it('should return the correct title when only tokenSymbol is defined', () => {
      const result = getTokenPageTitle(new Token(1, ZERO_ADDRESS, 18, 'BDT', undefined))
      expect(result).toBe('BDT: Buy, sell, and trade on Uniswap')
    })

    it('should return the correct title when tokenName and tokenSymbol are defined', () => {
      const result = getTokenPageTitle(new Token(1, ZERO_ADDRESS, 18, 'BDT', 'Baby Doge Token'))
      expect(result).toBe('Baby Doge Token (BDT): Buy, sell, and trade on Uniswap')
    })
  })
})
