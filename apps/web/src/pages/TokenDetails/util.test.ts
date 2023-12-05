import { Chain, TokenQuery } from 'graphql/data/__generated__/types-and-hooks'

import { getTokenPageTitle } from './utils'

function getMockTokenQuery(name: string | undefined, symbol: string | undefined): TokenQuery {
  return {
    __typename: 'Query',
    token: {
      __typename: 'Token',
      id: '0x123',
      name,
      symbol,
      chain: Chain.Ethereum,
    },
  }
}

describe('pages/TokenDetails/util', () => {
  describe('getTokenPageTitle', () => {
    it('should return the correct title when tokenName and tokenSymbol are undefined', () => {
      const result = getTokenPageTitle(getMockTokenQuery(undefined, undefined))
      expect(result).toBe('Buy & Trade: Live Price & Chart on Uniswap')
    })

    it('should return the correct title when only tokenName is defined', () => {
      const result = getTokenPageTitle(getMockTokenQuery('Baby Doge Token', undefined))
      expect(result).toBe('Buy & Trade Baby Doge Token: Live Price & Chart on Uniswap')
    })

    it('should return the correct title when only tokenSymbol is defined', () => {
      const result = getTokenPageTitle(getMockTokenQuery(undefined, 'BDT'))
      expect(result).toBe('Buy & Trade BDT: Live Price & Chart on Uniswap')
    })

    it('should return the correct title when tokenName and tokenSymbol are defined', () => {
      const result = getTokenPageTitle(getMockTokenQuery('Baby Doge Token', 'BDT'))
      expect(result).toBe('Buy & Trade Baby Doge Token (BDT): Live Price & Chart on Uniswap')
    })
  })
})
