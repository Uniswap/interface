import { CurrencyAmount } from '@uniswap/sdk-core'
import { USDC } from 'uniswap/src/constants/tokens'
import { usePriceDifference } from 'uniswap/src/features/transactions/swap/hooks/usePriceDifference'
import type { SwapFormStoreState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import * as useSwapFormStoreModule from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { createGasEstimate } from 'uniswap/src/test/fixtures/tradingApi'
import { createEmptyTradeWithStatus } from 'uniswap/src/test/fixtures/transactions/swap'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { CurrencyField } from 'uniswap/src/types/currency'

jest.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStore: jest.fn(),
}))

// Alias to the mocked function for easy access
const mockUseSwapFormStore = useSwapFormStoreModule.useSwapFormStore as jest.Mock

describe(usePriceDifference, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns price difference of 0', async () => {
    mockSwapFormStore('1000', '1000')
    const derivedSwapInfo = mockUseSwapFormStore((s: Omit<SwapFormStoreState, 'actions'>) => s.derivedSwapInfo)
    const { result } = renderHookWithProviders(() => usePriceDifference(derivedSwapInfo))

    expect(result.current).toEqual({
      priceDifferencePercentage: expect.closeTo(0, 5),
      showPriceDifferenceWarning: false,
      priceDifferenceColor: undefined,
    })
  })

  it('should not show price difference warning', async () => {
    mockSwapFormStore('1000', '990')
    const derivedSwapInfo = mockUseSwapFormStore((s: Omit<SwapFormStoreState, 'actions'>) => s.derivedSwapInfo)
    const { result } = renderHookWithProviders(() => usePriceDifference(derivedSwapInfo))

    expect(result.current).toEqual({
      priceDifferencePercentage: expect.closeTo(-1, 5),
      showPriceDifferenceWarning: false,
      priceDifferenceColor: undefined,
    })
  })

  it('should show low price difference warning', async () => {
    mockSwapFormStore('1000', '950')
    const derivedSwapInfo = mockUseSwapFormStore((s: Omit<SwapFormStoreState, 'actions'>) => s.derivedSwapInfo)
    const { result } = renderHookWithProviders(() => usePriceDifference(derivedSwapInfo))

    expect(result.current).toEqual({
      priceDifferencePercentage: expect.closeTo(-5, 5),
      showPriceDifferenceWarning: true,
      priceDifferenceColor: '$statusWarning',
    })
  })

  it('should show high price difference warning', async () => {
    mockSwapFormStore('1000', '900')
    const derivedSwapInfo = mockUseSwapFormStore((s: Omit<SwapFormStoreState, 'actions'>) => s.derivedSwapInfo)
    const { result } = renderHookWithProviders(() => usePriceDifference(derivedSwapInfo))

    expect(result.current).toEqual({
      priceDifferencePercentage: expect.closeTo(-10, 5),
      showPriceDifferenceWarning: true,
      priceDifferenceColor: '$statusCritical',
    })
  })
})

function mockSwapFormStore(inputAmount: string, outputAmount: string): void {
  mockUseSwapFormStore.mockImplementation((selector: (state: Omit<SwapFormStoreState, 'actions'>) => unknown) =>
    selector({
      amountUpdatedTimeRef: { current: 0 },
      exactAmountFiatRef: { current: '' },
      exactAmountTokenRef: { current: '' },
      updateSwapForm: jest.fn(),
      exactCurrencyField: CurrencyField.INPUT,
      filteredChainIds: {},
      isFiatMode: false,
      isMax: false,
      isSubmitting: false,
      isConfirmed: false,
      showPendingUI: false,
      derivedSwapInfo: {
        currencyAmountsUSDValue: {
          [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(USDC, inputAmount),
          [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(USDC, outputAmount),
        },
        currencies: {
          [CurrencyField.INPUT]: {
            currency: USDC,
            currencyId: USDC.address,
            logoUrl: undefined,
          },
          [CurrencyField.OUTPUT]: {
            currency: USDC,
            currencyId: USDC.address,
            logoUrl: undefined,
          },
        },
        currencyAmounts: {
          [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(USDC, inputAmount),
          [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(USDC, outputAmount),
        },
        currencyBalances: {
          [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(USDC, inputAmount),
          [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(USDC, outputAmount),
        },
        exactAmountToken: USDC.address,
        exactCurrencyField: CurrencyField.INPUT,
        outputAmountUserWillReceive: CurrencyAmount.fromRawAmount(USDC, outputAmount),
        trade: createEmptyTradeWithStatus({ gasEstimate: createGasEstimate() }),
        chainId: 1,
        focusOnCurrencyField: CurrencyField.INPUT,
        wrapType: WrapType.NotApplicable,
      },
    }),
  )
}
