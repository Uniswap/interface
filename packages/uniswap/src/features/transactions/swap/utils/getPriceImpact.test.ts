import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
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
const MAINNET_CHAIN_ID = 1

const createClassicTradeMock = (priceImpact: Percent): Trade =>
  ({
    priceImpact,
  }) as Trade

const createUniswapXTradeMock = (quote: unknown): Trade =>
  ({
    quote,
  }) as Trade

const createChainedActionTradeMock = (overrides: Record<string, unknown> = {}): Trade => ({ ...overrides }) as Trade

describe('getPriceImpact', () => {
  const mockPercent = (value: number): Percent => {
    return new Percent(value, 100)
  }

  const mockCurrency = new Token(1, '0x0000000000000000000000000000000000000001', 6, 'USDC', 'USD Coin')
  const mockVaultCurrency = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'vUSDC', 'Vault USDC')
  const mockCurrencyAmount = (amount: string | number, currency = mockCurrency): CurrencyAmount<Token> => {
    return CurrencyAmount.fromRawAmount(currency, amount)
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
    chainId: MAINNET_CHAIN_ID as DerivedSwapInfo['chainId'],

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
    const trade = createClassicTradeMock(priceImpact)
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
    const trade = createUniswapXTradeMock({ quote: { classicGasUseEstimateUSD: '100' } })
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
    const trade = createUniswapXTradeMock({ quote: { classicGasUseEstimateUSD: '100' } })
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
    const trade = createUniswapXTradeMock({ quote: {} })
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
    const trade = createChainedActionTradeMock()
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

  it('returns USD-based price impact for Earn deposits when output is the underlying preview asset', () => {
    // Arrange
    const trade = createChainedActionTradeMock({
      earnIntent: {
        action: 'deposit',
        vault: mockVaultCurrency.address,
        chainId: MAINNET_CHAIN_ID,
      },
      outputAmount: mockCurrencyAmount('900'),
      quote: {
        quote: {
          earnPreview: {
            type: 'DEPOSIT',
            depositAssets: [
              {
                token: mockCurrency.address,
                chainId: MAINNET_CHAIN_ID,
                amount: '900',
              },
            ],
            estimatedSharesOut: '1000000000000000000',
          },
        },
      },
    })
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
    expect(result?.equalTo(new Percent(10, 100))).toBe(true)
  })

  it('returns undefined for Earn deposits when output is not the underlying preview asset', () => {
    // Arrange
    const trade = createChainedActionTradeMock({
      earnIntent: {
        action: 'deposit',
        vault: mockVaultCurrency.address,
        chainId: MAINNET_CHAIN_ID,
      },
      outputAmount: mockCurrencyAmount('1000000000000000000', mockVaultCurrency),
      quote: {
        quote: {
          earnPreview: {
            type: 'DEPOSIT',
            depositAssets: [
              {
                token: mockCurrency.address,
                chainId: MAINNET_CHAIN_ID,
                amount: '900',
              },
            ],
            estimatedSharesOut: '1000000000000000000',
          },
        },
      },
    })
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
    expect(result).toBeUndefined()
  })

  it('returns undefined for chained trade with missing USD values', () => {
    // Arrange
    const trade = createChainedActionTradeMock()
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
