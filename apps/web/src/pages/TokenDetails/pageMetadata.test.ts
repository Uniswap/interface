import { Token } from '@uniswap/sdk-core'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import i18n from 'uniswap/src/i18n'
import { getTokenPageDescription, getTokenPageTitle } from '~/pages/TokenDetails/pageMetadata'

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

  describe('getTokenPageDescription', () => {
    it('should return the correct description when tokenName and tokenSymbol are undefined', () => {
      const result = getTokenPageDescription({ currency: new Token(1, ZERO_ADDRESS, 18) })
      expect(result).toBe('Buy, sell, and swap tokens. View real-time prices, charts, trading data, and more.')
    })

    it('should return the correct description when tokenName and tokenSymbol are defined', () => {
      const result = getTokenPageDescription({
        currency: new Token(1, ZERO_ADDRESS, 18, 'BDT', 'Baby Doge Token'),
      })
      expect(result).toBe(
        'Buy, sell, and swap Baby Doge Token (BDT). View real-time prices, charts, trading data, and more.',
      )
    })

    it('should return the correct description with chain suffix for non-mainnet chain', () => {
      const result = getTokenPageDescription({
        currency: new Token(UniverseChainId.ArbitrumOne, ZERO_ADDRESS, 18, 'ARB', 'Arbitrum'),
        chainId: UniverseChainId.ArbitrumOne,
      })
      expect(result).toBe(
        'Buy, sell, and swap Arbitrum (ARB) on Arbitrum. View real-time prices, charts, trading data, and more.',
      )
    })

    it('should return the correct description with price', () => {
      const result = getTokenPageDescription({
        currency: new Token(1, ZERO_ADDRESS, 18, 'ETH', 'Ethereum'),
        price: '$3,500.00',
      })
      expect(result).toBe(
        'Buy, sell, and swap Ethereum (ETH). View real-time prices, charts, trading data, and more. Current price: $3,500.00',
      )
    })

    it('should return the correct description with both chain and price', () => {
      const result = getTokenPageDescription({
        currency: new Token(UniverseChainId.Base, ZERO_ADDRESS, 18, 'USDC', 'USD Coin'),
        chainId: UniverseChainId.Base,
        price: '$1.00',
      })
      expect(result).toBe(
        'Buy, sell, and swap USD Coin (USDC) on Base. View real-time prices, charts, trading data, and more. Current price: $1.00',
      )
    })

    it('should not include chain suffix for mainnet', () => {
      const result = getTokenPageDescription({
        currency: new Token(UniverseChainId.Mainnet, ZERO_ADDRESS, 18, 'ETH', 'Ethereum'),
        chainId: UniverseChainId.Mainnet,
        price: '$3,500.00',
      })
      expect(result).toBe(
        'Buy, sell, and swap Ethereum (ETH). View real-time prices, charts, trading data, and more. Current price: $3,500.00',
      )
    })
  })
})
