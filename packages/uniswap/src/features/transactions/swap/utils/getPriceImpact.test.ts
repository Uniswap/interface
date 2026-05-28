import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { Trade, TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
import { getPriceImpact } from 'uniswap/src/features/transactions/swap/utils/getPriceImpact'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isChained, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
import type { Mock } from 'vitest'

// Mocks for routing and getSwapFeeUsd
vi.mock('uniswap/src/features/transactions/swap/utils/routing', () => ({
  isChained: vi.fn(),
  isClassic: vi.fn(),
  isJupiter: vi.fn(),
  isUniswapX: vi.fn(),
}))
vi.mock('uniswap/src/features/transactions/swap/utils/getSwapFeeUsd', () => ({
  getSwapFeeUsdFromDerivedSwapInfo: vi.fn(),
}))

// Type the mocks for TypeScript
const isChainedMock = isChained as unknown as Mock
const isClassicMock = isClassic as unknown as Mock
const isUniswapXMock = isUniswapX as unknown as Mock
const getSwapFeeUsdFromDerivedSwapInfoMock = getSwapFeeUsdFromDerivedSwapInfo as unknown as Mock

// Minimal ClassicTrade mock
class ClassicTradeMock {
  priceImpact: Percent
  constructor(priceImpact: Percent) {
    this.priceImpact = priceImpact
  }
}

// Minimal UniswapXTrade mock
class UniswapXTradeMock {
  quote: unknown
  constructor(quote: unknown) {
    this.quote = quote
  }
}

// Minimal ChainedActionTrade mock — the real class declares `priceImpact: undefined`,
// so `getPriceImpact` does not read it on this branch (it falls back to USD values).
class ChainedActionTradeMock {}

describe('getPriceImpact', () => {
  const mockPercent = (value: number): Percent => {
    return new Percent(value, 100)
  }

  const mockCurrency = new Token(1, '0x0000000000000000000000000000000000000000', 6, 'USDC', 'USD Coin')
  const mockCurrencyAmount = (amount: string | number): CurrencyAmount<typeof mockCurrency> => {
    return CurrencyAmount.fromRawAmount(mockCurrency, amount)
  }

  const makeTradeWithStatus = (trade: Trade | null = null): TradeWithStatus => ({
    isLoading: false,
    error: null,
    trade,
    indicativeTrade: undefined,
    isIndicativeLoading: false,
    gasEstimate: undefined,
    quoteHash: '',
  })

  const makeDerivedSwapInfo = (
    trade: Trade | null | undefined,
    overrides: Partial<DerivedSwapInfo> = {},
  ): DerivedSwapInfo => ({
    chainId: UniverseChainId.Mainnet,

    currencies: {
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: null,
    },
    currencyAmounts: {
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: null,
    },
    currencyBalances: {
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: null,
    },
    currencyAmountsUSDValue: {
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: null,
    },
    outputAmountUserWillReceive: null,
    focusOnCurrencyField: null,
    trade: makeTradeWithStatus(trade),
    wrapType: WrapType.NotApplicable,
    exactAmountToken: '',
    exactCurrencyField: CurrencyField.INPUT,
    ...overrides,
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns undefined if there is no trade', () => {
    // Arrange
    const derivedSwapInfo = makeDerivedSwapInfo(undefined)
    // Act
    const result = getPriceImpact(derivedSwapInfo)
    // Assert
    expect(result).toBeUndefined()
  })

  it('returns trade.priceImpact for classic trades', () => {
    // Arrange
    const priceImpact = mockPercent(7)
    const trade = new ClassicTradeMock(priceImpact) as unknown as Trade
    isClassicMock.mockReturnValue(true)
    isUniswapXMock.mockReturnValue(false)
    const derivedSwapInfo = makeDerivedSwapInfo(trade)
    // Act
    const result = getPriceImpact(derivedSwapInfo)
    // Assert
    expect(result).toBe(priceImpact)
  })

  it('returns calculated price impact for UniswapX trades', () => {
    // Arrange
    const trade = new UniswapXTradeMock({ quote: { classicGasUseEstimateUSD: '100' } }) as unknown as Trade
    isClassicMock.mockReturnValue(false)
    isUniswapXMock.mockReturnValue(true)
    const inputUSD = mockCurrencyAmount('1000')
    const outputUSD = mockCurrencyAmount('900')
    getSwapFeeUsdFromDerivedSwapInfoMock.mockReturnValue(50)
    const derivedSwapInfo = makeDerivedSwapInfo(trade, {
      currencyAmountsUSDValue: {
        [CurrencyField.INPUT]: inputUSD,
        [CurrencyField.OUTPUT]: outputUSD,
      },
    })
    // Act
    const result = getPriceImpact(derivedSwapInfo)
    // Assert
    expect(result).toBeDefined()
    expect(typeof result?.toFixed).toBe('function')
  })

  it('returns undefined for non-classic, non-UniswapX trades', () => {
    // Arrange
    const trade = null
    isClassicMock.mockReturnValue(false)
    isUniswapXMock.mockReturnValue(false)
    const derivedSwapInfo = makeDerivedSwapInfo(trade)
    // Act
    const result = getPriceImpact(derivedSwapInfo)
    // Assert
    expect(result).toBeUndefined()
  })

  it('returns undefined for UniswapX trade with missing USD values', () => {
    // Arrange
    const trade = new UniswapXTradeMock({ quote: { classicGasUseEstimateUSD: '100' } }) as unknown as Trade
    isClassicMock.mockReturnValue(false)
    isUniswapXMock.mockReturnValue(true)
    const derivedSwapInfo = makeDerivedSwapInfo(trade, {
      currencyAmountsUSDValue: {
        [CurrencyField.INPUT]: null,
        [CurrencyField.OUTPUT]: null,
      },
    })
    // Act
    const result = getPriceImpact(derivedSwapInfo)
    // Assert
    expect(result).toBeUndefined()
  })

  it('returns undefined for UniswapX trade with missing classicGasEstimateUSD', () => {
    // Arrange
    const trade = new UniswapXTradeMock({ quote: {} }) as unknown as Trade
    isClassicMock.mockReturnValue(false)
    isUniswapXMock.mockReturnValue(true)
    const inputUSD = mockCurrencyAmount('1000')
    const outputUSD = mockCurrencyAmount('900')
    const derivedSwapInfo = makeDerivedSwapInfo(trade, {
      currencyAmountsUSDValue: {
        [CurrencyField.INPUT]: inputUSD,
        [CurrencyField.OUTPUT]: outputUSD,
      },
    })
    // Act
    const result = getPriceImpact(derivedSwapInfo)
    // Assert
    expect(result).toBeUndefined()
  })

  it('returns USD-based price impact for chained trades with valid USD values', () => {
    // Arrange
    const trade = new ChainedActionTradeMock() as unknown as Trade
    isClassicMock.mockReturnValue(false)
    isUniswapXMock.mockReturnValue(false)
    isChainedMock.mockReturnValue(true)
    const inputUSD = mockCurrencyAmount('1000')
    const outputUSD = mockCurrencyAmount('900')
    const derivedSwapInfo = makeDerivedSwapInfo(trade, {
      currencyAmountsUSDValue: {
        [CurrencyField.INPUT]: inputUSD,
        [CurrencyField.OUTPUT]: outputUSD,
      },
    })
    // Act
    const result = getPriceImpact(derivedSwapInfo)
    // Assert
    // 1 - 900/1000 = 0.10 = 10%
    expect(result).toBeInstanceOf(Percent)
    expect(result?.equalTo(new Percent(10, 100))).toBe(true)
  })

  it('returns undefined for chained trade with missing USD values', () => {
    // Arrange
    const trade = new ChainedActionTradeMock() as unknown as Trade
    isClassicMock.mockReturnValue(false)
    isUniswapXMock.mockReturnValue(false)
    isChainedMock.mockReturnValue(true)
    const derivedSwapInfo = makeDerivedSwapInfo(trade, {
      currencyAmountsUSDValue: {
        [CurrencyField.INPUT]: null,
        [CurrencyField.OUTPUT]: null,
      },
    })
    // Act
    const result = getPriceImpact(derivedSwapInfo)
    // Assert
    expect(result).toBeUndefined()
  })
})
