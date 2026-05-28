import { ChainToken, MultichainToken, SafetyLevel, SpamCode } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  dataApiChainTokenToCurrencyInfo,
  dataApiMultichainTokenToSearchResult,
} from 'uniswap/src/data/rest/dataApiMultichainToken'
import { createDataApiMultichainToken } from 'uniswap/src/test/fixtures/dataApi/multichainToken'

describe('dataApiChainTokenToCurrencyInfo', () => {
  it('should build a CurrencyInfo from a ChainToken and parent MultichainToken', () => {
    const parent = createDataApiMultichainToken()
    const chainToken = new ChainToken({
      chainId: 1,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
    })

    const result = dataApiChainTokenToCurrencyInfo({ chainToken, parent })

    expect(result).not.toBeNull()
    expect(result?.currency.chainId).toBe(1)
    expect(result?.currency.symbol).toBe('USDC')
    expect(result?.currency.name).toBe('USD Coin')
    expect(result?.logoUrl).toBe('https://example.com/usdc.png')
  })

  it('should return null for invalid chainId', () => {
    const parent = createDataApiMultichainToken()
    const chainToken = new ChainToken({ chainId: 0, address: '', decimals: 6 })

    expect(dataApiChainTokenToCurrencyInfo({ chainToken, parent })).toBeNull()
  })

  it('should convert ETH address to native currency', () => {
    const parent = createDataApiMultichainToken({ symbol: 'ETH', name: 'Ethereum' })
    const chainToken = new ChainToken({ chainId: 1, address: 'ETH', decimals: 18 })

    const result = dataApiChainTokenToCurrencyInfo({ chainToken, parent })

    expect(result?.currency.isNative).toBe(true)
  })

  it('should apply feeData from parent MultichainToken feeDetector', () => {
    const parent = new MultichainToken({
      multichainId: 'mc:test',
      symbol: 'FEE',
      name: 'Fee Token',
      safetyLevel: SafetyLevel.VERIFIED,
      spamCode: SpamCode.NOT_SPAM,
      feeData: {
        feeDetector: {
          sellFeeBps: '200',
          buyFeeBps: '100',
          feeTakenOnTransfer: false,
          externalTransferFailed: false,
          sellReverted: false,
        },
      },
      chainTokens: [],
    })
    const chainToken = new ChainToken({
      chainId: 1,
      address: '0x1111111111111111111111111111111111111111',
      decimals: 18,
    })

    const result = dataApiChainTokenToCurrencyInfo({ chainToken, parent })

    if (result?.currency.isToken) {
      expect(result.currency.sellFeeBps?.toString()).toBe('200')
      expect(result.currency.buyFeeBps?.toString()).toBe('100')
    }
  })
})

describe('dataApiMultichainTokenToSearchResult', () => {
  it('should convert a MultichainToken with multiple chains', () => {
    const mt = createDataApiMultichainToken({
      chainTokens: [
        new ChainToken({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }),
        new ChainToken({ chainId: 137, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 }),
      ],
    })

    const result = dataApiMultichainTokenToSearchResult(mt)

    expect(result).toBeDefined()
    expect(result?.id).toBe('mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(result?.name).toBe('USD Coin')
    expect(result?.symbol).toBe('USDC')
    expect(result?.logoUrl).toBe('https://example.com/usdc.png')
    expect(result?.tokens).toHaveLength(2)
    expect(result?.tokens[0]?.currency.chainId).toBe(1)
    expect(result?.tokens[1]?.currency.chainId).toBe(137)
  })

  it('should return undefined when chainTokens is empty', () => {
    const mt = createDataApiMultichainToken({ chainTokens: [] })

    expect(dataApiMultichainTokenToSearchResult(mt)).toBeUndefined()
  })

  it('should return undefined when all chain tokens fail currency construction', () => {
    const mt = createDataApiMultichainToken({
      chainTokens: [new ChainToken({ chainId: 0, address: '', decimals: 6 })],
    })

    expect(dataApiMultichainTokenToSearchResult(mt)).toBeUndefined()
  })

  it('should skip invalid chain tokens but keep valid ones', () => {
    const mt = createDataApiMultichainToken({
      chainTokens: [
        new ChainToken({ chainId: 0, address: '', decimals: 6 }),
        new ChainToken({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }),
      ],
    })

    const result = dataApiMultichainTokenToSearchResult(mt)

    expect(result?.tokens).toHaveLength(1)
    expect(result?.tokens[0]?.currency.chainId).toBe(1)
  })

  it('should populate parent-level safetyInfo', () => {
    const mt = createDataApiMultichainToken({ safetyLevel: SafetyLevel.VERIFIED })

    const result = dataApiMultichainTokenToSearchResult(mt)

    expect(result?.safetyInfo).toBeDefined()
    expect(result?.safetyInfo?.tokenList).toBeDefined()
  })

  it('should use shared logoUrl on each CurrencyInfo', () => {
    const mt = createDataApiMultichainToken({ logoUrl: 'https://example.com/token.png' })

    const result = dataApiMultichainTokenToSearchResult(mt)

    expect(result?.tokens[0]?.logoUrl).toBe('https://example.com/token.png')
  })

  it('should handle ETH native token', () => {
    const mt = createDataApiMultichainToken({
      symbol: 'ETH',
      name: 'Ethereum',
      chainTokens: [new ChainToken({ chainId: 1, address: 'ETH', decimals: 18 })],
    })

    const result = dataApiMultichainTokenToSearchResult(mt)

    expect(result?.tokens).toHaveLength(1)
    expect(result?.tokens[0]?.currency.isNative).toBe(true)
  })

  it('should set logoUrl to undefined when empty string', () => {
    const mt = createDataApiMultichainToken({ logoUrl: '' })

    const result = dataApiMultichainTokenToSearchResult(mt)

    expect(result?.logoUrl).toBeUndefined()
  })
})
