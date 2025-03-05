import { renderHook } from '@testing-library/react-hooks'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useSyncFiatAndTokenAmountUpdater } from 'uniswap/src/features/transactions/swap/hooks/useSyncFiatAndTokenAmountUpdater'

// Mock all dependencies
jest.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: jest.fn(),
}))

jest.mock('uniswap/src/features/tokens/getCurrencyAmount', () => ({
  ValueType: {
    Exact: 'EXACT',
  },
  getCurrencyAmount: jest.fn(),
}))

jest.mock('uniswap/src/utils/currencyId', () => ({
  currencyIdToChain: jest.fn(),
}))

jest.mock('uniswap/src/features/transactions/swap/hooks/useUSDCPrice', () => ({
  useUSDCPrice: jest.fn(),
  STABLECOIN_AMOUNT_OUT: {
    1: { currency: {} as Currency },
  },
}))

jest.mock('uniswap/src/features/transactions/swap/contexts/SwapFormContext', () => ({
  useSwapFormContext: jest.fn(),
}))

// Import mocked functions
const { useLocalizationContext } = jest.requireMock('uniswap/src/features/language/LocalizationContext')
const { getCurrencyAmount } = jest.requireMock('uniswap/src/features/tokens/getCurrencyAmount')
const { currencyIdToChain } = jest.requireMock('uniswap/src/utils/currencyId')
const { useUSDCPrice } = jest.requireMock('uniswap/src/features/transactions/swap/hooks/useUSDCPrice')
const { useSwapFormContext } = jest.requireMock('uniswap/src/features/transactions/swap/contexts/SwapFormContext')

const useSwapFormContextMock = useSwapFormContext as jest.Mock

describe('useSyncFiatAndTokenAmountUpdater', () => {
  // Mock setup
  const mockUpdateSwapForm = jest.fn()
  const mockConvertFiatAmount = jest.fn()
  const mockQuote = jest.fn()
  const mockInvert = jest.fn()
  const mockCurrencyAmount = { toExact: jest.fn().mockReturnValue('1') } as unknown as CurrencyAmount<Currency>

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mocks
    useSwapFormContext.mockReturnValue({
      isFiatMode: false,
      updateSwapForm: mockUpdateSwapForm,
      exactAmountToken: '1',
      exactAmountFiat: '10',
      derivedSwapInfo: {
        currencies: {
          INPUT: {
            currencyId: 'ethereum:0x...',
            currency: {} as Currency,
          },
        },
      },
      exactCurrencyField: 'INPUT',
    })

    useLocalizationContext.mockReturnValue({
      convertFiatAmount: mockConvertFiatAmount,
    })

    mockConvertFiatAmount.mockReturnValue({ amount: 1 })

    currencyIdToChain.mockReturnValue(1) // Ethereum mainnet

    mockInvert.mockReturnValue({ quote: mockQuote })
    mockQuote.mockReturnValue(mockCurrencyAmount)

    useUSDCPrice.mockReturnValue({
      price: {
        quote: mockQuote,
        invert: mockInvert,
      },
    })

    getCurrencyAmount.mockReturnValue(mockCurrencyAmount)
  })

  it('should update token amount when in fiat mode', () => {
    // Set fiat mode to true
    useSwapFormContextMock.mockReturnValue({
      isFiatMode: true,
      updateSwapForm: mockUpdateSwapForm,
      exactAmountToken: '',
      exactAmountFiat: '10',
      derivedSwapInfo: {
        currencies: {
          INPUT: {
            currencyId: 'ethereum:0x...',
            currency: {} as Currency,
          },
        },
      },
      exactCurrencyField: 'INPUT',
    })

    // Render the hook
    renderHook(() => useSyncFiatAndTokenAmountUpdater({}))

    // Verify token amount was updated
    expect(mockUpdateSwapForm).toHaveBeenCalledWith({ exactAmountToken: '1' })
  })

  it('should update fiat amount when not in fiat mode', () => {
    // Set fiat mode to false
    useSwapFormContextMock.mockReturnValue({
      isFiatMode: false,
      updateSwapForm: mockUpdateSwapForm,
      exactAmountToken: '1',
      exactAmountFiat: '',
      derivedSwapInfo: {
        currencies: {
          INPUT: {
            currencyId: 'ethereum:0x...',
            currency: {} as Currency,
          },
        },
      },
      exactCurrencyField: 'INPUT',
    })

    // Render the hook
    renderHook(() => useSyncFiatAndTokenAmountUpdater({}))

    // Verify fiat amount was updated
    expect(mockUpdateSwapForm).toHaveBeenCalledWith({ exactAmountFiat: '1.00' })
  })

  it('should update fiat amount when in fiat mode but exactAmountFiat is empty', () => {
    // Set fiat mode to true but with empty fiat amount
    useSwapFormContextMock.mockReturnValue({
      isFiatMode: true,
      updateSwapForm: mockUpdateSwapForm,
      exactAmountToken: '1',
      exactAmountFiat: '',
      derivedSwapInfo: {
        currencies: {
          INPUT: {
            currencyId: 'ethereum:0x...',
            currency: {} as Currency,
          },
        },
      },
      exactCurrencyField: 'INPUT',
    })

    // Render the hook
    renderHook(() => useSyncFiatAndTokenAmountUpdater({}))

    // Verify fiat amount was updated
    expect(mockUpdateSwapForm).toHaveBeenCalledWith({ exactAmountFiat: '1.00' })
  })

  it('should do nothing when skip is true', () => {
    // Render the hook with skip=true
    renderHook(() => useSyncFiatAndTokenAmountUpdater({ skip: true }))

    // Verify no updates were made
    expect(mockUpdateSwapForm).not.toHaveBeenCalled()
  })

  it('should do nothing when exactCurrency is undefined', () => {
    // Set exactCurrency to undefined
    useSwapFormContextMock.mockReturnValue({
      isFiatMode: false,
      updateSwapForm: mockUpdateSwapForm,
      exactAmountToken: '1',
      exactAmountFiat: '10',
      derivedSwapInfo: {
        currencies: {
          INPUT: undefined,
        },
      },
      exactCurrencyField: 'INPUT',
    })

    // Render the hook
    renderHook(() => useSyncFiatAndTokenAmountUpdater({}))

    // Verify no updates were made
    expect(mockUpdateSwapForm).not.toHaveBeenCalled()
  })
})
