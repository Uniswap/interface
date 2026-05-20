import { MultichainToken, ChainToken, SpamCode } from '@uniswap/client-data-api/dist/data/v1/searchTypes_pb'
import { toMultichainSearchResult } from 'uniswap/src/data/rest/toMultichainSearchResult'

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

describe('toMultichainSearchResult', () => {
  it('should convert a MultichainToken with multiple chains into a MultichainSearchResult', () => {
    const mt = createMultichainToken({
      chainTokens: [
        new ChainToken({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }),
        new ChainToken({ chainId: 137, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 }),
      ],
    })

    const result = toMultichainSearchResult(mt)

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
    const mt = createMultichainToken({ chainTokens: [] })

    expect(toMultichainSearchResult(mt)).toBeUndefined()
  })

  it('should return undefined when all chain tokens fail currency construction', () => {
    const mt = createMultichainToken({
      chainTokens: [new ChainToken({ chainId: 0, address: '', decimals: 6 })],
    })

    expect(toMultichainSearchResult(mt)).toBeUndefined()
  })

  it('should skip invalid chain tokens but keep valid ones', () => {
    const mt = createMultichainToken({
      chainTokens: [
        new ChainToken({ chainId: 0, address: '', decimals: 6 }),
        new ChainToken({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }),
      ],
    })

    const result = toMultichainSearchResult(mt)

    expect(result?.tokens).toHaveLength(1)
    expect(result?.tokens[0]?.currency.chainId).toBe(1)
  })

  it('should use shared logoUrl from MultichainToken on each CurrencyInfo', () => {
    const mt = createMultichainToken({ logoUrl: 'https://example.com/token.png' })

    const result = toMultichainSearchResult(mt)

    expect(result?.tokens[0]?.logoUrl).toBe('https://example.com/token.png')
  })

  it('should convert ETH address to native address', () => {
    const mt = createMultichainToken({
      symbol: 'ETH',
      name: 'Ethereum',
      chainTokens: [new ChainToken({ chainId: 1, address: 'ETH', decimals: 18 })],
    })

    const result = toMultichainSearchResult(mt)

    expect(result?.tokens).toHaveLength(1)
    expect(result?.tokens[0]?.currency.isNative).toBe(true)
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

    const result = toMultichainSearchResult(mt)

    expect(result?.tokens).toHaveLength(2)

    const chain1Currency = result?.tokens[0]?.currency
    const chain137Currency = result?.tokens[1]?.currency

    if (chain1Currency?.isToken) {
      expect(chain1Currency.sellFeeBps?.toString()).toBe('500')
      expect(chain1Currency.buyFeeBps?.toString()).toBe('300')
    }
    if (chain137Currency?.isToken) {
      expect(chain137Currency.sellFeeBps?.toString()).toBe('200')
      expect(chain137Currency.buyFeeBps?.toString()).toBe('100')
    }
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

    const result = toMultichainSearchResult(mt)

    expect(result?.tokens[0]?.safetyInfo?.tokenList).toBeDefined()
  })

  it('should populate parent-level safetyInfo from MultichainToken fields', () => {
    const mt = createMultichainToken({ safetyLevel: 'VERIFIED' })

    const result = toMultichainSearchResult(mt)

    expect(result?.safetyInfo).toBeDefined()
    expect(result?.safetyInfo?.tokenList).toBeDefined()
  })
})
