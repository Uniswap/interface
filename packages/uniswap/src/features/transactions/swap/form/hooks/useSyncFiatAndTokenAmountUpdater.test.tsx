import { renderHook } from '@testing-library/react'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useSyncFiatAndTokenAmountUpdater } from 'uniswap/src/features/transactions/swap/form/hooks/useSyncFiatAndTokenAmountUpdater'
import { SwapFormStoreState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import * as useSwapFormStoreModule from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

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

jest.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCPrice: jest.fn(),
  STABLECOIN_AMOUNT_OUT: {
    1: { currency: {} as Currency },
  },
}))

// Mock swap form store hooks (both selector-based hooks)
jest.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStore: jest.fn(),
  useSwapFormStoreDerivedSwapInfo: jest.fn(),
}))

// Import mocked functions
const { useLocalizationContext } = jest.requireMock('uniswap/src/features/language/LocalizationContext')
const { getCurrencyAmount } = jest.requireMock('uniswap/src/features/tokens/getCurrencyAmount')
const { currencyIdToChain } = jest.requireMock('uniswap/src/utils/currencyId')
const { useUSDCPrice } = jest.requireMock('uniswap/src/features/transactions/hooks/useUSDCPrice')

// alias mocked derived function
const mockedUseSwapFormStoreDerivedSwapInfo = (
  useSwapFormStoreModule as unknown as {
    useSwapFormStoreDerivedSwapInfo: jest.Mock
  }
).useSwapFormStoreDerivedSwapInfo

type UseSwapFormStoreSelector<T> = (s: Partial<Omit<SwapFormStoreState, 'actions'>>) => T

type UseSwapFormStoreDerivedSwapInfoSelector<T> = (s: DerivedSwapInfo) => T

describe('useSyncFiatAndTokenAmountUpdater', () => {
  // Mock setup
  const mockUpdateSwapForm = jest.fn()
  const mockConvertFiatAmount = jest.fn()
  const mockQuote = jest.fn()
  const mockInvert = jest.fn()
  const mockCurrencyAmount = { toExact: jest.fn().mockReturnValue('1') } as unknown as CurrencyAmount<Currency>

  beforeEach(() => {
    jest.clearAllMocks()

    const mockUseSwapFormStore = useSwapFormStoreModule.useSwapFormStore as jest.Mock

    // Default mock implementation (fiat mode off)
    mockUseSwapFormStore.mockImplementation((selector: UseSwapFormStoreSelector<Partial<SwapFormStoreState>>) =>
      selector({
        isFiatMode: false,
        updateSwapForm: mockUpdateSwapForm,
        exactAmountToken: '1',
        exactAmountFiat: '10',
        exactCurrencyField: CurrencyField.INPUT,
      }),
    )

    mockedUseSwapFormStoreDerivedSwapInfo.mockImplementation(
      (selector: UseSwapFormStoreDerivedSwapInfoSelector<Partial<SwapFormStoreState>>) =>
        selector({
          // @ts-expect-error TODO: Be more precise about the type
          currencies: {
            [CurrencyField.INPUT]: {
              currencyId: 'ethereum:0x...',
              currency: {} as Currency,
              logoUrl: '',
            },
          },
        }),
    )

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
    const mockUseSwapFormStore = useSwapFormStoreModule.useSwapFormStore as jest.Mock

    // Default mock implementation (fiat mode off)
    mockUseSwapFormStore.mockImplementation((selector: UseSwapFormStoreSelector<Partial<SwapFormStoreState>>) =>
      selector({
        isFiatMode: true,
        updateSwapForm: mockUpdateSwapForm,
        exactAmountToken: '',
        exactAmountFiat: '10',
        exactCurrencyField: CurrencyField.INPUT,
      }),
    )

    // Render the hook
    renderHook(() => useSyncFiatAndTokenAmountUpdater({}))

    // Verify token amount was updated
    expect(mockUpdateSwapForm).toHaveBeenCalledWith({ exactAmountToken: '1' })
  })

  it('should update fiat amount when not in fiat mode', () => {
    // Set fiat mode to false
    const mockUseSwapFormStore = useSwapFormStoreModule.useSwapFormStore as jest.Mock

    // Default mock implementation (fiat mode off)
    mockUseSwapFormStore.mockImplementation((selector: UseSwapFormStoreSelector<Partial<SwapFormStoreState>>) =>
      selector({
        isFiatMode: false,
        updateSwapForm: mockUpdateSwapForm,
        exactAmountToken: '1',
        exactAmountFiat: '',
        exactCurrencyField: CurrencyField.INPUT,
      }),
    )

    // Render the hook
    renderHook(() => useSyncFiatAndTokenAmountUpdater({}))

    // Verify fiat amount was updated
    expect(mockUpdateSwapForm).toHaveBeenCalledWith({ exactAmountFiat: '1.00' })
  })

  it('should update fiat amount when in fiat mode but exactAmountFiat is empty', () => {
    // Set fiat mode to true but with empty fiat amount
    const mockUseSwapFormStore = useSwapFormStoreModule.useSwapFormStore as jest.Mock

    // Default mock implementation (fiat mode off)
    mockUseSwapFormStore.mockImplementation((selector: UseSwapFormStoreSelector<Partial<SwapFormStoreState>>) =>
      selector({
        isFiatMode: true,
        updateSwapForm: mockUpdateSwapForm,
        exactAmountToken: '1',
        exactAmountFiat: '',
        exactCurrencyField: CurrencyField.INPUT,
      }),
    )

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
    const mockUseSwapFormStore = useSwapFormStoreModule.useSwapFormStore as jest.Mock

    // Default mock implementation (fiat mode off)
    mockUseSwapFormStore.mockImplementation((selector: UseSwapFormStoreSelector<Partial<SwapFormStoreState>>) =>
      selector({
        isFiatMode: false,
        updateSwapForm: mockUpdateSwapForm,
        exactAmountToken: '1',
        exactAmountFiat: '10',
        exactCurrencyField: CurrencyField.INPUT,
      }),
    )

    mockedUseSwapFormStoreDerivedSwapInfo.mockImplementationOnce(
      (selector: UseSwapFormStoreDerivedSwapInfoSelector<Partial<SwapFormStoreState>>) =>
        selector({
          // @ts-expect-error TODO: Be more precise about the type
          currencies: {
            [CurrencyField.INPUT]: undefined,
          },
        }),
    )

    // Render the hook
    renderHook(() => useSyncFiatAndTokenAmountUpdater({}))

    // Verify no updates were made
    expect(mockUpdateSwapForm).not.toHaveBeenCalled()
  })
})
