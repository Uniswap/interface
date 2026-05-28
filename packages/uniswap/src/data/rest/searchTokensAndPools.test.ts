import { ChainToken, MultichainToken, SpamCode, Token } from '@uniswap/client-data-api/dist/data/v1/searchTypes_pb'
import { multichainTokenToCurrencyInfos, searchTokenToCurrencyInfo } from 'uniswap/src/data/rest/searchTokensAndPools'

function createMultichainToken(
  overrides: Partial<{
    multichainId: string
    symbol: string
    name: string
    logoUrl: string
    safetyLevel: string
    isSpam: string
    spamCode: SpamCode
    chainTokens: ChainToken[]
  }> = {},
): MultichainToken {
  return new MultichainToken({
    multichainId: overrides.multichainId ?? 'mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: overrides.symbol ?? 'USDC',
    name: overrides.name ?? 'USD Coin',
    standard: 'ERC20',
    projectName: 'Circle',
    logoUrl: overrides.logoUrl ?? 'https://example.com/usdc.png',
    safetyLevel: overrides.safetyLevel ?? 'VERIFIED',
    isSpam: overrides.isSpam ?? 'false',
    spamCode: overrides.spamCode ?? SpamCode.NOT_SPAM,
    chainTokens: overrides.chainTokens ?? [
      new ChainToken({
        chainId: 1,
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        safetyLevel: 'VERIFIED',
        isSpam: 'false',
      }),
    ],
  })
}

describe('multichainTokenToCurrencyInfos', () => {
  it('should produce one CurrencyInfo per ChainToken', () => {
    const mt = createMultichainToken({
      chainTokens: [
        new ChainToken({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }),
        new ChainToken({ chainId: 137, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 }),
      ],
    })

    const results = multichainTokenToCurrencyInfos(mt)

    expect(results).toHaveLength(2)
    expect(results[0]?.currency.chainId).toBe(1)
    expect(results[0]?.currency.symbol).toBe('USDC')
    expect(results[1]?.currency.chainId).toBe(137)
    expect(results[1]?.currency.symbol).toBe('USDC')

    const expectedParent = {
      id: 'mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      tokenCurrencyIds: [results[0]!.currencyId, results[1]!.currencyId],
    }
    expect(results[0]?.searchMultichainParent).toEqual(expectedParent)
    expect(results[1]?.searchMultichainParent).toEqual(expectedParent)
  })

  it('should use shared logoUrl from MultichainToken', () => {
    const mt = createMultichainToken({ logoUrl: 'https://example.com/token.png' })

    const results = multichainTokenToCurrencyInfos(mt)

    expect(results[0]?.logoUrl).toBe('https://example.com/token.png')
  })

  it('should return empty array when chainTokens is empty', () => {
    const mt = createMultichainToken({ chainTokens: [] })

    expect(multichainTokenToCurrencyInfos(mt)).toEqual([])
  })

  it('should filter out chain tokens that fail currency construction', () => {
    const mt = createMultichainToken({
      chainTokens: [new ChainToken({ chainId: 0, address: '', decimals: 6 })],
    })

    const results = multichainTokenToCurrencyInfos(mt)

    expect(results).toHaveLength(0)
  })

  it('should use chain-level feeData when present, falling back to parent', () => {
    const mt = new MultichainToken({
      multichainId: 'mc:test',
      symbol: 'FEE',
      name: 'Fee Token',
      logoUrl: '',
      safetyLevel: 'VERIFIED',
      isSpam: 'false',
      feeData: {
        sellFeeBps: '200',
        buyFeeBps: '100',
        feeTakenOnTransfer: false,
        externalTransferFailed: false,
        sellReverted: false,
      },
      chainTokens: [
        new ChainToken({
          chainId: 1,
          address: '0x1111111111111111111111111111111111111111',
          decimals: 18,
          feeData: {
            sellFeeBps: '500',
            buyFeeBps: '300',
            feeTakenOnTransfer: false,
            externalTransferFailed: false,
            sellReverted: false,
          },
        }),
        new ChainToken({
          chainId: 137,
          address: '0x2222222222222222222222222222222222222222',
          decimals: 18,
        }),
      ],
    })

    const results = multichainTokenToCurrencyInfos(mt)

    expect(results).toHaveLength(2)

    const chain1Currency = results[0]?.currency
    const chain137Currency = results[1]?.currency

    expect(chain1Currency?.isToken).toBe(true)
    expect(chain137Currency?.isToken).toBe(true)

    if (chain1Currency?.isToken) {
      // Chain 1: chain-level override
      expect(chain1Currency.sellFeeBps?.toString()).toBe('500')
      expect(chain1Currency.buyFeeBps?.toString()).toBe('300')
    }
    if (chain137Currency?.isToken) {
      // Chain 137: falls back to parent feeData
      expect(chain137Currency.sellFeeBps?.toString()).toBe('200')
      expect(chain137Currency.buyFeeBps?.toString()).toBe('100')
    }
  })

  it('should convert ETH address to native address', () => {
    const mt = createMultichainToken({
      symbol: 'ETH',
      name: 'Ethereum',
      chainTokens: [new ChainToken({ chainId: 1, address: 'ETH', decimals: 18 })],
    })

    const results = multichainTokenToCurrencyInfos(mt)

    expect(results).toHaveLength(1)
    expect(results[0]?.currency.isNative).toBe(true)
  })

  it('should fall back to parent safetyLevel when chain-level is empty', () => {
    const mt = createMultichainToken({
      safetyLevel: 'MEDIUM_WARNING',
      chainTokens: [
        new ChainToken({
          chainId: 1,
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          decimals: 6,
          safetyLevel: '',
        }),
      ],
    })

    const results = multichainTokenToCurrencyInfos(mt)

    expect(results).toHaveLength(1)
    expect(results[0]?.safetyInfo?.tokenList).toBeDefined()
  })
})

describe('searchTokenToCurrencyInfo', () => {
  it('should convert a search token to CurrencyInfo', () => {
    const token = new Token({
      tokenId: 'TOKEN:1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chainId: 1,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      logoUrl: 'https://example.com/usdc.png',
      safetyLevel: 'VERIFIED',
    })

    const result = searchTokenToCurrencyInfo(token)

    expect(result).not.toBeNull()
    expect(result?.currency.symbol).toBe('USDC')
    expect(result?.currency.name).toBe('USD Coin')
    expect(result?.currency.chainId).toBe(1)
    expect(result?.logoUrl).toBe('https://example.com/usdc.png')
  })

  it('should return null for invalid token data', () => {
    const token = new Token({ chainId: 0, address: '', decimals: 0 })

    const result = searchTokenToCurrencyInfo(token)

    expect(result).toBeNull()
  })
})
