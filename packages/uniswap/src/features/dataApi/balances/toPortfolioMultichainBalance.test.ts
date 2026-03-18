import type { ChainBalance, MultichainBalance } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  getPortfolioMultichainBalancesById,
  toPortfolioMultichainBalance,
} from 'uniswap/src/features/dataApi/balances/toPortfolioMultichainBalance'

function createChainBalance(
  overrides: Partial<{
    chainId: number
    address: string
    decimals: number
    amount: number
    valueUsd: number
  }> = {},
): ChainBalance {
  const {
    chainId = 1,
    address = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals = 6,
    amount = 1,
    valueUsd = 10,
  } = overrides
  return {
    chainId,
    address,
    decimals,
    amount: { amount, raw: String(amount) },
    valueUsd,
  } as unknown as ChainBalance
}

function createMultichainBalance(
  overrides: Partial<{
    name: string
    symbol: string
    logoUrl: string
    chainBalances: ChainBalance[]
    totalAmount: number
    priceUsd: number
    pricePercentChange1d: number
    totalValueUsd: number
    isHidden: boolean
  }> = {},
): MultichainBalance {
  const {
    name = 'USD Coin',
    symbol = 'USDC',
    logoUrl = '',
    chainBalances = [createChainBalance()],
    totalAmount = 1,
    priceUsd = 10,
    pricePercentChange1d = 0,
    totalValueUsd = 10,
    isHidden = false,
  } = overrides
  return {
    name,
    symbol,
    logoUrl,
    chainBalances,
    totalAmount: { amount: totalAmount, raw: String(totalAmount) },
    priceUsd,
    pricePercentChange1d,
    totalValueUsd,
    isHidden,
    protectionInfo: undefined,
    feeData: undefined,
    safetyLevel: 0,
    spamCode: 0,
  } as unknown as MultichainBalance
}

describe(toPortfolioMultichainBalance, () => {
  it('returns undefined when chainBalances is empty', () => {
    const multichain = createMultichainBalance({ chainBalances: [] })
    expect(toPortfolioMultichainBalance(multichain)).toBeUndefined()
  })

  it('converts single chainBalance (legacy shape) to PortfolioMultichainBalance', () => {
    const multichain = createMultichainBalance({
      name: 'USD Coin',
      symbol: 'USDC',
      chainBalances: [
        createChainBalance({
          chainId: 1,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          decimals: 6,
          amount: 2,
          valueUsd: 20,
        }),
      ],
      totalValueUsd: 20,
      priceUsd: 10,
      pricePercentChange1d: -1.5,
      isHidden: true,
    })
    const result = toPortfolioMultichainBalance(multichain, '0xowner')

    expect(result).toBeDefined()
    expect(result!.name).toBe('USD Coin')
    expect(result!.symbol).toBe('USDC')
    expect(result!.totalValueUsd).toBe(20)
    expect(result!.priceUsd).toBe(10)
    expect(result!.pricePercentChange1d).toBe(-1.5)
    expect(result!.isHidden).toBe(true)
    expect(result!.tokens).toHaveLength(1)
    expect(result!.tokens[0]!.chainId).toBe(1)
    expect(result!.tokens[0]!.quantity).toBe(2)
    expect(result!.tokens[0]!.valueUsd).toBe(20)
    expect(result!.tokens[0]!.currencyInfo.currencyId).toMatch(/^1-0x/)
    expect(result!.id).toBe(result!.tokens[0]!.currencyInfo.currencyId)
    expect(result!.cacheId).toBe(`TokenBalance:${result!.id}-0xowner`)
  })

  it('uses first token id for id and cacheId', () => {
    const multichain = createMultichainBalance({
      chainBalances: [createChainBalance()],
    })
    const result = toPortfolioMultichainBalance(multichain)
    const firstTokenId = result!.tokens[0]!.currencyInfo.currencyId

    expect(result!.id).toBe(firstTokenId)
    expect(result!.cacheId).toBe(`TokenBalance:${firstTokenId}`)
  })

  it('ignores multichainBalance.id and uses first token id for id and cacheId', () => {
    const multichain = createMultichainBalance({
      chainBalances: [createChainBalance()],
    })
    const result = toPortfolioMultichainBalance(multichain)
    const firstTokenId = result!.tokens[0]!.currencyInfo.currencyId

    expect(result!.id).toBe(firstTokenId)
    expect(result!.cacheId).toBe(`TokenBalance:${firstTokenId}`)
  })

  it('omits ownerAddress from cacheId when not provided', () => {
    const multichain = createMultichainBalance()
    const result = toPortfolioMultichainBalance(multichain)
    const firstTokenId = result!.tokens[0]!.currencyInfo.currencyId

    expect(result!.cacheId).toBe(`TokenBalance:${firstTokenId}`)
  })

  it('converts multiple chainBalances (true multichain)', () => {
    const multichain = createMultichainBalance({
      chainBalances: [
        createChainBalance({
          chainId: 1,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          amount: 10,
          valueUsd: 10,
        }),
        createChainBalance({
          chainId: 8453,
          address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          amount: 5,
          valueUsd: 5,
        }),
      ],
      totalAmount: 15,
      totalValueUsd: 15,
    })
    const result = toPortfolioMultichainBalance(multichain)

    expect(result!.tokens).toHaveLength(2)
    expect(result!.tokens[0]!.chainId).toBe(1)
    expect(result!.tokens[0]!.quantity).toBe(10)
    expect(result!.tokens[1]!.chainId).toBe(8453)
    expect(result!.tokens[1]!.quantity).toBe(5)
    expect(result!.totalAmount).toBe(15)
    expect(result!.totalValueUsd).toBe(15)
    const firstTokenId = result!.tokens[0]!.currencyInfo.currencyId
    expect(result!.id).toBe(firstTokenId)
  })

  it('uses totalAmount from API when present', () => {
    const multichain = createMultichainBalance({
      chainBalances: [createChainBalance({ amount: 100 })],
      totalAmount: 99,
    })
    const result = toPortfolioMultichainBalance(multichain)

    expect(result!.totalAmount).toBe(99)
  })

  it('falls back to sum of token quantities when totalAmount is missing', () => {
    const multichain = createMultichainBalance({
      chainBalances: [
        createChainBalance({ amount: 3 }),
        createChainBalance({ chainId: 8453, address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', amount: 7 }),
      ],
    })
    const multichainNoTotal = { ...multichain, totalAmount: undefined } as unknown as MultichainBalance
    const result = toPortfolioMultichainBalance(multichainNoTotal)

    expect(result!.totalAmount).toBe(10)
  })
})

describe(getPortfolioMultichainBalancesById, () => {
  it('returns undefined when response is undefined', () => {
    expect(getPortfolioMultichainBalancesById(undefined)).toBeUndefined()
  })

  it('returns undefined when portfolio is missing', () => {
    expect(getPortfolioMultichainBalancesById({} as never)).toBeUndefined()
  })

  it('returns undefined when multichainBalances is empty or missing', () => {
    expect(getPortfolioMultichainBalancesById({ portfolio: {} } as never)).toBeUndefined()
    expect(getPortfolioMultichainBalancesById({ portfolio: { multichainBalances: [] } } as never)).toBeUndefined()
  })

  it('builds map keyed by balance id (currencyId for single-token)', () => {
    const response = {
      portfolio: {
        multichainBalances: [
          createMultichainBalance({ symbol: 'USDC', chainBalances: [createChainBalance({ chainId: 1 })] }),
          createMultichainBalance({
            symbol: 'USDT',
            chainBalances: [createChainBalance({ chainId: 1, address: '0xdac17f958d2ee523a2206206994597c13d831ec7' })],
          }),
        ],
      },
    } as never
    const result = getPortfolioMultichainBalancesById(response, '0xowner')

    expect(result).toBeDefined()
    expect(Object.keys(result!)).toHaveLength(2)
    const ids = Object.keys(result!)
    expect(ids[0]).toMatch(/^1-0x/)
    expect(ids[1]).toMatch(/^1-0x/)
    expect(result![ids[0]!]!.symbol).toBe('USDC')
    expect(result![ids[1]!]!.symbol).toBe('USDT')
  })

  it('keys map by first token id', () => {
    const response = {
      portfolio: {
        multichainBalances: [createMultichainBalance({ chainBalances: [createChainBalance()] })],
      },
    } as never
    const result = getPortfolioMultichainBalancesById(response)

    expect(result).toBeDefined()
    expect(Object.keys(result!)).toHaveLength(1)
    const key = Object.keys(result!)[0]!
    expect(result![key]!.symbol).toBe('USDC')
  })

  it('passes ownerAddress to converter', () => {
    const response = {
      portfolio: {
        multichainBalances: [createMultichainBalance()],
      },
    } as never
    const result = getPortfolioMultichainBalancesById(response, '0xuser')

    const balance = Object.values(result!)[0]!
    expect(balance.cacheId).toContain('0xuser')
  })
})
