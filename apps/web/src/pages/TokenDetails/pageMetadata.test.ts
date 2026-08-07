import type { PlainMessage } from '@bufbuild/protobuf'
import { TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { Token as V2Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { Token } from '@uniswap/sdk-core'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import i18n from 'uniswap/src/i18n'
import { getTokenPageDescription, getTokenPageTitle, getTokenStructuredData } from '~/pages/TokenDetails/pageMetadata'

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

  describe('getTokenStructuredData', () => {
    const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

    const buildV2Token = (overrides: Partial<PlainMessage<V2Token>> = {}): PlainMessage<V2Token> => ({
      chainId: UniverseChainId.Mainnet,
      address: USDC_ADDRESS,
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      type: TokenType.ERC20,
      price: { spotUsd: 1.0001 },
      safety: undefined,
      fees: undefined,
      project: { logoUrl: 'https://example.com/logo.png', descriptionTranslations: {} },
      multichain: undefined,
      ...overrides,
    })

    it('returns null without a token', () => {
      expect(getTokenStructuredData({ token: undefined, price: undefined, pageDescription: 'desc' })).toBeNull()
    })

    it('builds Product and BreadcrumbList entries from a V2 token', () => {
      const result = getTokenStructuredData({ token: buildV2Token(), price: 1.0001, pageDescription: 'desc' })

      expect(result?.[0]).toMatchObject({
        '@type': 'Product',
        name: 'USD Coin (USDC)',
        image: ['https://example.com/logo.png'],
        description: 'desc',
        offers: expect.objectContaining({
          priceCurrency: 'USD',
          price: 1.0001,
          url: expect.stringContaining(`/ethereum/${USDC_ADDRESS}`),
        }),
      })
      expect(result?.[1]).toMatchObject({ '@type': 'BreadcrumbList' })
    })

    it('uses the NATIVE url segment for native tokens', () => {
      const result = getTokenStructuredData({
        token: buildV2Token({ type: TokenType.NATIVE, address: ZERO_ADDRESS, symbol: 'ETH', name: 'Ethereum' }),
        price: 3500,
        pageDescription: 'desc',
      })

      const offers = (result?.[0] as { offers: { url: string } }).offers
      expect(offers.url).toContain('/ethereum/NATIVE')
    })
  })
})
