import { CurrencyAmount } from '@uniswap/sdk-core'
import { USDC } from 'uniswap/src/constants/tokens'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { usePriceDifference } from 'uniswap/src/features/transactions/swap/hooks/usePriceDifference'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { createGasFeeEstimates } from 'uniswap/src/test/fixtures/tradingApi'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { CurrencyField } from 'uniswap/src/types/currency'

jest.mock('uniswap/src/features/transactions/swap/contexts/SwapFormContext')
const mockUseSwapFormContext = useSwapFormContext as jest.MockedFunction<typeof useSwapFormContext>

describe(usePriceDifference, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns price difference of 0', async () => {
    mockSwapFormContext('1000', '1000')
    const { derivedSwapInfo } = mockUseSwapFormContext()
    const { result } = renderHookWithProviders(() => usePriceDifference(derivedSwapInfo))

    expect(result.current).toEqual({
      priceDifferencePercentage: expect.closeTo(0, 5),
      showPriceDifferenceWarning: false,
      priceDifferenceColor: undefined,
    })
  })

  it('should not show price difference warning', async () => {
    mockSwapFormContext('1000', '990')
    const { derivedSwapInfo } = mockUseSwapFormContext()
    const { result } = renderHookWithProviders(() => usePriceDifference(derivedSwapInfo))

    expect(result.current).toEqual({
      priceDifferencePercentage: expect.closeTo(-1, 5),
      showPriceDifferenceWarning: false,
      priceDifferenceColor: undefined,
    })
  })

  it('should show low price difference warning', async () => {
    mockSwapFormContext('1000', '950')
    const { derivedSwapInfo } = mockUseSwapFormContext()
    const { result } = renderHookWithProviders(() => usePriceDifference(derivedSwapInfo))

    expect(result.current).toEqual({
      priceDifferencePercentage: expect.closeTo(-5, 5),
      showPriceDifferenceWarning: true,
      priceDifferenceColor: '$statusWarning',
    })
  })

  it('should show high price difference warning', async () => {
    mockSwapFormContext('1000', '900')
    const { derivedSwapInfo } = mockUseSwapFormContext()
    const { result } = renderHookWithProviders(() => usePriceDifference(derivedSwapInfo))

    expect(result.current).toEqual({
      priceDifferencePercentage: expect.closeTo(-10, 5),
      showPriceDifferenceWarning: true,
      priceDifferenceColor: '$statusCritical',
    })
  })
})

function mockSwapFormContext(inputAmount: string, outputAmount: string): void {
  mockUseSwapFormContext.mockReturnValue({
    amountUpdatedTimeRef: { current: 0 },
    exactAmountFiatRef: { current: '' },
    exactAmountTokenRef: { current: '' },
    updateSwapForm: jest.fn(),
    exactCurrencyField: CurrencyField.INPUT,
    filteredChainIds: {},
    isFiatMode: false,
    isMax: false,
    isSubmitting: false,
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
      trade: {
        isLoading: false,
        error: null,
        trade: null,
        indicativeTrade: undefined,
        isIndicativeLoading: false,
        gasEstimates: createGasFeeEstimates(),
      },
      chainId: 1,
      focusOnCurrencyField: CurrencyField.INPUT,
      wrapType: WrapType.NotApplicable,
    },
  })
}
