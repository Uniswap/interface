import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  Amount,
  Balance,
  MultichainBalance,
  Portfolio,
  Token,
  TokenMetadata,
  TokenType,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  shouldTransformToMultichain,
  transformPortfolioToMultichain,
} from 'uniswap/src/data/rest/transformPortfolioToMultichain'

function createLegacyBalance(
  overrides: {
    chainId?: number
    address?: string
    name?: string
    symbol?: string
    decimals?: number
    amountRaw?: string
    amountValue?: number
    valueUsd?: number
    priceUsd?: number
    pricePercentChange1d?: number
    isHidden?: boolean
    projectName?: string
    logoUrl?: string
  } = {},
): Balance {
  const {
    chainId = 1,
    address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name = 'USD Coin',
    symbol = 'USDC',
    decimals = 6,
    amountRaw = '1000000',
    amountValue = 1,
    valueUsd = 1,
    priceUsd = 1,
    pricePercentChange1d = 0,
    isHidden = false,
    projectName = '',
    logoUrl = '',
  } = overrides

  const amount = new Amount({ raw: amountRaw, amount: amountValue })
  const token = new Token({
    chainId,
    address,
    symbol,
    decimals,
    name,
    type: TokenType.ERC20,
    metadata: new TokenMetadata({
      projectName,
      logoUrl,
      safetyLevel: 0,
      spamCode: 0,
      isBridged: false,
    }),
  })
  return new Balance({
    token,
    amount,
    priceUsd,
    pricePercentChange1d,
    valueUsd,
    isHidden,
  })
}

describe('transformPortfolioToMultichain', () => {
  it('should return undefined when response is undefined', () => {
    expect(transformPortfolioToMultichain(undefined)).toBeUndefined()
  })

  it('should return response unchanged when portfolio is missing', () => {
    const response = new GetPortfolioResponse({})
    expect(transformPortfolioToMultichain(response)).toBe(response)
  })

  it('should return response unchanged when portfolio has no legacy balances', () => {
    const portfolio = new Portfolio({
      balances: [],
      totalValueUsd: 100,
      totalValueAbsoluteChange1d: 0,
      totalValuePercentChange1d: 0,
      multichainBalances: [],
    })
    const response = new GetPortfolioResponse({ portfolio })
    expect(transformPortfolioToMultichain(response)).toBe(response)
  })

  it('should transform one legacy balance into one MultichainBalance with one ChainBalance', () => {
    const balance = createLegacyBalance({
      chainId: 1,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      amountRaw: '2000000',
      amountValue: 2,
      valueUsd: 2.5,
      priceUsd: 1.25,
      pricePercentChange1d: -0.5,
      isHidden: false,
    })
    const portfolio = new Portfolio({
      balances: [balance],
      totalValueUsd: 2.5,
      totalValueAbsoluteChange1d: 0.1,
      totalValuePercentChange1d: 4,
      multichainBalances: [],
    })
    const response = new GetPortfolioResponse({ portfolio })

    const result = transformPortfolioToMultichain(response)

    expect(result).not.toBe(response)
    expect(result?.portfolio).toBeDefined()
    expect(result?.portfolio?.balances).toEqual([])
    expect(result?.portfolio?.multichainBalances).toHaveLength(1)

    const mc = result!.portfolio!.multichainBalances[0]!
    expect(mc.name).toBe('USD Coin')
    expect(mc.symbol).toBe('USDC')
    expect(mc.totalValueUsd).toBe(2.5)
    expect(mc.priceUsd).toBe(1.25)
    expect(mc.pricePercentChange1d).toBe(-0.5)
    expect(mc.isHidden).toBe(false)
    expect(mc.chainBalances).toHaveLength(1)
    expect(mc.chainBalances[0]?.chainId).toBe(1)
    expect(mc.chainBalances[0]?.address).toBe('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(mc.chainBalances[0]?.decimals).toBe(6)
    expect(mc.chainBalances[0]?.valueUsd).toBe(2.5)

    expect(result?.portfolio?.totalValueUsd).toBe(2.5)
    expect(result?.portfolio?.totalValueAbsoluteChange1d).toBe(0.1)
    expect(result?.portfolio?.totalValuePercentChange1d).toBe(4)
  })

  it('should transform multiple legacy balances into multiple MultichainBalances', () => {
    const balance1 = createLegacyBalance({
      chainId: 1,
      symbol: 'USDC',
      valueUsd: 10,
    })
    const balance2 = createLegacyBalance({
      chainId: 8453,
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      symbol: 'USDC',
      name: 'USD Coin (Base)',
      valueUsd: 5,
    })
    const portfolio = new Portfolio({
      balances: [balance1, balance2],
      totalValueUsd: 15,
      totalValueAbsoluteChange1d: 0,
      totalValuePercentChange1d: 0,
      multichainBalances: [],
    })
    const response = new GetPortfolioResponse({ portfolio })

    const result = transformPortfolioToMultichain(response)

    expect(result?.portfolio?.multichainBalances).toHaveLength(2)
    expect(result?.portfolio?.balances).toEqual([])
    expect(result?.portfolio?.totalValueUsd).toBe(15)

    expect(result?.portfolio?.multichainBalances[0]?.chainBalances).toHaveLength(1)
    expect(result?.portfolio?.multichainBalances[0]?.chainBalances[0]?.chainId).toBe(1)
    expect(result?.portfolio?.multichainBalances[1]?.chainBalances[0]?.chainId).toBe(8453)
  })

  it('should preserve metadata fields when present', () => {
    const balance = createLegacyBalance({
      projectName: 'Circle',
      logoUrl: 'https://example.com/usdc.png',
    })
    const portfolio = new Portfolio({
      balances: [balance],
      totalValueUsd: 1,
      totalValueAbsoluteChange1d: 0,
      totalValuePercentChange1d: 0,
      multichainBalances: [],
    })
    const response = new GetPortfolioResponse({ portfolio })

    const result = transformPortfolioToMultichain(response)
    const mc = result!.portfolio!.multichainBalances[0]!
    expect(mc.projectName).toBe('Circle')
    expect(mc.logoUrl).toBe('https://example.com/usdc.png')
  })

  it('should preserve isHidden when true', () => {
    const balance = createLegacyBalance({
      symbol: 'USDC',
      valueUsd: 100,
      isHidden: true,
    })
    const portfolio = new Portfolio({
      balances: [balance],
      totalValueUsd: 100,
      totalValueAbsoluteChange1d: 0,
      totalValuePercentChange1d: 0,
      multichainBalances: [],
    })
    const response = new GetPortfolioResponse({ portfolio })

    const result = transformPortfolioToMultichain(response)
    const mc = result!.portfolio!.multichainBalances[0]!
    expect(mc.isHidden).toBe(true)
    expect(mc.symbol).toBe('USDC')
    expect(mc.totalValueUsd).toBe(100)
  })

  it('should preserve isHidden per balance when transforming multiple balances', () => {
    const visible = createLegacyBalance({ symbol: 'USDC', valueUsd: 10, isHidden: false })
    const hidden = createLegacyBalance({
      chainId: 8453,
      symbol: 'USDC',
      valueUsd: 5,
      isHidden: true,
    })
    const portfolio = new Portfolio({
      balances: [visible, hidden],
      totalValueUsd: 15,
      totalValueAbsoluteChange1d: 0,
      totalValuePercentChange1d: 0,
      multichainBalances: [],
    })
    const response = new GetPortfolioResponse({ portfolio })

    const result = transformPortfolioToMultichain(response)
    expect(result?.portfolio?.multichainBalances).toHaveLength(2)
    expect(result?.portfolio?.multichainBalances[0]?.isHidden).toBe(false)
    expect(result?.portfolio?.multichainBalances[1]?.isHidden).toBe(true)
  })

  it('should preserve symbol and valueUsd for each token when transforming multiple balances', () => {
    const usdcMainnet = createLegacyBalance({
      chainId: 1,
      symbol: 'USDC',
      valueUsd: 100,
      amountValue: 100,
    })
    const usdcBase = createLegacyBalance({
      chainId: 8453,
      symbol: 'USDC',
      valueUsd: 50,
      amountValue: 50,
    })
    const eth = createLegacyBalance({
      chainId: 1,
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      valueUsd: 2000,
    })
    const portfolio = new Portfolio({
      balances: [usdcMainnet, usdcBase, eth],
      totalValueUsd: 2150,
      totalValueAbsoluteChange1d: 0,
      totalValuePercentChange1d: 0,
      multichainBalances: [],
    })
    const response = new GetPortfolioResponse({ portfolio })

    const result = transformPortfolioToMultichain(response)
    const mcs = result!.portfolio!.multichainBalances
    expect(mcs).toHaveLength(3)

    expect(mcs[0]?.symbol).toBe('USDC')
    expect(mcs[0]?.totalValueUsd).toBe(100)
    expect(mcs[0]?.chainBalances[0]?.valueUsd).toBe(100)

    expect(mcs[1]?.symbol).toBe('USDC')
    expect(mcs[1]?.totalValueUsd).toBe(50)
    expect(mcs[1]?.chainBalances[0]?.valueUsd).toBe(50)

    expect(mcs[2]?.symbol).toBe('ETH')
    expect(mcs[2]?.totalValueUsd).toBe(2000)
    expect(mcs[2]?.chainBalances[0]?.valueUsd).toBe(2000)
  })

  it('should use defaults when token or metadata fields are missing', () => {
    const amount = new Amount({ raw: '1', amount: 1 })
    const balance = new Balance({
      token: undefined,
      amount,
      priceUsd: 0,
      pricePercentChange1d: 0,
      valueUsd: 0,
      isHidden: false,
    })
    const portfolio = new Portfolio({
      balances: [balance],
      totalValueUsd: 0,
      totalValueAbsoluteChange1d: 0,
      totalValuePercentChange1d: 0,
      multichainBalances: [],
    })
    const response = new GetPortfolioResponse({ portfolio })

    const result = transformPortfolioToMultichain(response)
    const mc = result!.portfolio!.multichainBalances[0]!
    expect(mc.name).toBe('')
    expect(mc.symbol).toBe('')
    expect(mc.chainBalances[0]?.chainId).toBe(0)
    expect(mc.chainBalances[0]?.address).toBe('')
    expect(mc.chainBalances[0]?.decimals).toBe(0)
  })
})

describe('shouldTransformToMultichain', () => {
  it('should return false when response is undefined', () => {
    expect(shouldTransformToMultichain(undefined)).toBe(false)
  })

  it('should return false when portfolio is missing', () => {
    const response = new GetPortfolioResponse({})
    expect(shouldTransformToMultichain(response)).toBe(false)
  })

  it('should return false when portfolio has no legacy balances', () => {
    const portfolio = new Portfolio({
      balances: [],
      totalValueUsd: 0,
      totalValueAbsoluteChange1d: 0,
      totalValuePercentChange1d: 0,
      multichainBalances: [],
    })
    const response = new GetPortfolioResponse({ portfolio })
    expect(shouldTransformToMultichain(response)).toBe(false)
  })

  it('should return true when portfolio has legacy balances and no multichainBalances', () => {
    const portfolio = new Portfolio({
      balances: [createLegacyBalance()],
      totalValueUsd: 1,
      totalValueAbsoluteChange1d: 0,
      totalValuePercentChange1d: 0,
      multichainBalances: [],
    })
    const response = new GetPortfolioResponse({ portfolio })
    expect(shouldTransformToMultichain(response)).toBe(true)
  })

  it('should return false when portfolio has both legacy and multichain balances', () => {
    const portfolio = new Portfolio({
      balances: [createLegacyBalance()],
      totalValueUsd: 1,
      totalValueAbsoluteChange1d: 0,
      totalValuePercentChange1d: 0,
      multichainBalances: [new MultichainBalance({ symbol: 'USDC', name: '', type: TokenType.ERC20 })],
    })
    const response = new GetPortfolioResponse({ portfolio })
    expect(shouldTransformToMultichain(response)).toBe(false)
  })
})
