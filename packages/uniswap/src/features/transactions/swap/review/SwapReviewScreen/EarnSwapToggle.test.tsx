import { fireEvent } from '@testing-library/react-native'
import type { Currency } from '@uniswap/sdk-core'
import { EARN_MIN_DEPOSIT_USD, EARN_SWAP_TOGGLE_MONTHLY_EARNINGS_THRESHOLD_USD } from 'uniswap/src/features/earn/config'
import { EarnPositionStatus } from 'uniswap/src/features/earn/hooks/useEarnPosition'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { EarnEventName } from 'uniswap/src/features/telemetry/constants/features'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { EarnSwapToggle } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/EarnSwapToggle'
import { renderWithProviders } from 'uniswap/src/test/render'

const {
  earnSwapToggleMonthlyEarningsThresholdUsd,
  mockSwapState,
  mockUpdateSwapForm,
  mockUseEarnPosition,
  mockUseEarnMinDepositUsd,
  mockUseEarnSwapToggleMonthlyEarningsThresholdUsd,
  mockUseSwapEarnIntent,
} = vi.hoisted(() => ({
  earnSwapToggleMonthlyEarningsThresholdUsd: 5_000,
  mockSwapState: {
    isEarnFlow: true,
    inputUsdValue: undefined as string | undefined,
    outputUsdValue: undefined as string | undefined,
  },
  mockUpdateSwapForm: vi.fn(),
  mockUseEarnPosition: vi.fn(),
  mockUseEarnMinDepositUsd: vi.fn(),
  mockUseEarnSwapToggleMonthlyEarningsThresholdUsd: vi.fn(),
  mockUseSwapEarnIntent: vi.fn(),
}))

vi.mock('uniswap/src/features/earn/config', () => ({
  EARN_MIN_DEPOSIT_USD: 5,
  EARN_SWAP_TOGGLE_MONTHLY_EARNINGS_THRESHOLD_USD: earnSwapToggleMonthlyEarningsThresholdUsd,
  useEarnMinDepositUsd: mockUseEarnMinDepositUsd,
  useEarnSwapToggleMonthlyEarningsThresholdUsd: mockUseEarnSwapToggleMonthlyEarningsThresholdUsd,
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStore: (selector: (s: unknown) => unknown): unknown =>
    selector({
      exactCurrencyField: 'input',
      isEarnFlow: mockSwapState.isEarnFlow,
      updateSwapForm: mockUpdateSwapForm,
    }),
  useSwapFormStoreDerivedSwapInfo: (selector: (s: unknown) => unknown): unknown =>
    selector({
      currencies: {
        input: {
          currency: { chainId: 1, isNative: true, symbol: 'ETH' } as unknown as Currency,
        },
        output: {
          currency: {
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            chainId: 1,
            isNative: false,
            symbol: 'USDC',
          } as unknown as Currency,
        },
      },
      currencyAmountsUSDValue: {
        input: mockSwapState.inputUsdValue ? { toExact: (): string => mockSwapState.inputUsdValue! } : undefined,
        output: mockSwapState.outputUsdValue ? { toExact: (): string => mockSwapState.outputUsdValue! } : undefined,
      },
    }),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: (): {
    convertFiatAmountFormatted: (value: number | string | undefined) => string
    formatPercent: (value: number) => string
  } => ({
    convertFiatAmountFormatted: (value): string => `$${Number(value ?? 0).toFixed(2)}`,
    formatPercent: (value): string => `${value}%`,
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (key: string, params?: Record<string, unknown>) => string
  } => ({
    t: (key, params): string => {
      if (key === 'explore.earn.vault.rateValue') {
        return `${params?.['apy']} APY`
      }
      if (key === 'explore.earn.swapToggle.monthlyEarnings') {
        return `${params?.['amount']} /mo`
      }
      if (key === 'explore.earn.swapToggle.onToken') {
        return `on ${params?.['symbol']}`
      }
      return key
    },
  }),
}))

vi.mock('uniswap/src/features/transactions/swap/hooks/useSwapEarnIntent', () => ({
  useSwapEarnIntent: (): unknown => mockUseSwapEarnIntent(),
}))

vi.mock('uniswap/src/features/earn/hooks/useEarnPosition', () => ({
  EarnPositionStatus: {
    Present: 'present',
    NoPosition: 'noPosition',
    Loading: 'loading',
    Error: 'error',
  },
  useEarnPosition: (): unknown => mockUseEarnPosition(),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAccount: (): unknown => ({
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  }),
}))

const VAULT = {
  id: '1-0x1111111111111111111111111111111111111111',
  currencyId: '1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  displayCurrencyId: '1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  vaultAddress: '0x1111111111111111111111111111111111111111',
  chainId: 1,
  apyPercent: 5,
} as unknown as EarnVaultInfo

const POSITION = {
  vaultId: 'vault-1',
  depositedUsd: 100,
  depositedRaw: '1000000',
  sharesRaw: '1000000',
} as unknown as EarnPositionInfo

const ZERO_BALANCE_POSITION = {
  ...POSITION,
  depositedRaw: '0',
  sharesRaw: '0',
} as unknown as EarnPositionInfo

function mockEarnState({
  isEligible = true,
  position,
  positionStatus,
}: {
  isEligible?: boolean
  position?: EarnPositionInfo
  positionStatus: EarnPositionStatus
}): void {
  mockUseSwapEarnIntent.mockReturnValue({ isEligible, vault: VAULT })
  mockUseEarnPosition.mockReturnValue({
    position,
    positionStatus,
    isSuccess: positionStatus === EarnPositionStatus.Present || positionStatus === EarnPositionStatus.NoPosition,
    isError: positionStatus === EarnPositionStatus.Error,
    isLoading: positionStatus === EarnPositionStatus.Loading,
  })
}

describe('EarnSwapToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEarnMinDepositUsd.mockReturnValue(EARN_MIN_DEPOSIT_USD)
    mockUseEarnSwapToggleMonthlyEarningsThresholdUsd.mockReturnValue(EARN_SWAP_TOGGLE_MONTHLY_EARNINGS_THRESHOLD_USD)
    mockSwapState.isEarnFlow = true
    mockSwapState.inputUsdValue = undefined
    mockSwapState.outputUsdValue = undefined
  })

  it('preserves the earn toggle intent when the position lookup errors transiently', () => {
    mockEarnState({ positionStatus: EarnPositionStatus.Error })

    renderWithProviders(<EarnSwapToggle />)

    expect(mockUpdateSwapForm).not.toHaveBeenCalledWith(expect.objectContaining({ isEarnFlow: false }))
  })

  it('preserves the earn toggle intent while the position lookup is still loading', () => {
    mockEarnState({ positionStatus: EarnPositionStatus.Loading })

    renderWithProviders(<EarnSwapToggle />)

    expect(mockUpdateSwapForm).not.toHaveBeenCalledWith(expect.objectContaining({ isEarnFlow: false }))
  })

  it('clears the earn flow once no position is confirmed', () => {
    mockEarnState({ positionStatus: EarnPositionStatus.NoPosition })

    renderWithProviders(<EarnSwapToggle />)

    expect(mockUpdateSwapForm).toHaveBeenCalledWith({
      isEarnFlow: false,
      earnSwapUpsellAnalyticsProperties: undefined,
    })
  })

  it('clears the earn flow once the position resolves with no raw balance', () => {
    mockEarnState({
      position: ZERO_BALANCE_POSITION,
      positionStatus: EarnPositionStatus.Present,
    })

    renderWithProviders(<EarnSwapToggle />)

    expect(mockUpdateSwapForm).toHaveBeenCalledWith({
      isEarnFlow: false,
      earnSwapUpsellAnalyticsProperties: undefined,
    })
  })

  it('clears the earn flow when the currency pair stops being earn-eligible', () => {
    mockEarnState({
      isEligible: false,
      position: POSITION,
      positionStatus: EarnPositionStatus.Present,
    })

    renderWithProviders(<EarnSwapToggle />)

    expect(mockUpdateSwapForm).toHaveBeenCalledWith({
      isEarnFlow: false,
      earnSwapUpsellAnalyticsProperties: undefined,
    })
  })

  it('does not clear the earn flow when eligible with an active position', () => {
    mockEarnState({
      position: POSITION,
      positionStatus: EarnPositionStatus.Present,
    })

    renderWithProviders(<EarnSwapToggle />)

    expect(mockUpdateSwapForm).not.toHaveBeenCalledWith(expect.objectContaining({ isEarnFlow: false }))
  })

  it('hides and clears the earn flow when the estimated deposit is below the minimum', () => {
    mockSwapState.inputUsdValue = String(EARN_MIN_DEPOSIT_USD - 0.01)
    mockSwapState.outputUsdValue = String(EARN_MIN_DEPOSIT_USD - 0.01)
    mockEarnState({
      position: POSITION,
      positionStatus: EarnPositionStatus.Present,
    })

    const { queryByText } = renderWithProviders(<EarnSwapToggle />)

    expect(queryByText('explore.earn.title')).toBeNull()
    expect(mockUpdateSwapForm).toHaveBeenCalledWith({ isEarnFlow: false })
  })

  it('uses the dynamic minimum deposit threshold and prefers the output deposit value', () => {
    mockUseEarnMinDepositUsd.mockReturnValue(25)
    mockSwapState.inputUsdValue = '100'
    mockSwapState.outputUsdValue = '24.99'
    mockEarnState({
      position: POSITION,
      positionStatus: EarnPositionStatus.Present,
    })

    const { queryByText } = renderWithProviders(<EarnSwapToggle />)

    expect(queryByText('explore.earn.title')).toBeNull()
    expect(mockUpdateSwapForm).toHaveBeenCalledWith({ isEarnFlow: false })
  })

  it('shows APY for swaps below the monthly earnings threshold', () => {
    mockSwapState.inputUsdValue = String(EARN_SWAP_TOGGLE_MONTHLY_EARNINGS_THRESHOLD_USD - 1)
    mockSwapState.outputUsdValue = String(EARN_SWAP_TOGGLE_MONTHLY_EARNINGS_THRESHOLD_USD)
    mockEarnState({
      position: POSITION,
      positionStatus: EarnPositionStatus.Present,
    })

    const { getByText, queryByText } = renderWithProviders(<EarnSwapToggle />)

    expect(getByText('5% APY')).toBeTruthy()
    expect(queryByText('$20.83 /mo')).toBeNull()
  })

  it('shows projected monthly earnings for swaps at or above the monthly earnings threshold', () => {
    mockSwapState.inputUsdValue = String(EARN_SWAP_TOGGLE_MONTHLY_EARNINGS_THRESHOLD_USD)
    mockSwapState.outputUsdValue = String(EARN_SWAP_TOGGLE_MONTHLY_EARNINGS_THRESHOLD_USD)
    mockEarnState({
      position: POSITION,
      positionStatus: EarnPositionStatus.Present,
    })

    const { getByText, queryByText } = renderWithProviders(<EarnSwapToggle />)

    expect(getByText('$20.83 /mo')).toBeTruthy()
    expect(queryByText('5% APY')).toBeNull()
  })

  it('uses the dynamic monthly earnings threshold when configured', () => {
    mockUseEarnSwapToggleMonthlyEarningsThresholdUsd.mockReturnValue(10_000)
    mockSwapState.inputUsdValue = '9999'
    mockSwapState.outputUsdValue = '9999'
    mockEarnState({
      position: POSITION,
      positionStatus: EarnPositionStatus.Present,
    })

    const { getByText, queryByText } = renderWithProviders(<EarnSwapToggle />)

    expect(getByText('5% APY')).toBeTruthy()
    expect(queryByText('$41.66 /mo')).toBeNull()
  })

  it('logs when the earn swap toggle is shown', () => {
    mockSwapState.inputUsdValue = '100'
    mockEarnState({
      position: POSITION,
      positionStatus: EarnPositionStatus.Present,
    })

    renderWithProviders(<EarnSwapToggle />)

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      EarnEventName.EarnSwapUpsellToggleShown,
      expect.objectContaining({
        entry_point: 'swap_review_toggle',
        has_existing_position: true,
        output_currency_id: '1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        position_balance_usd: 100,
        swap_amount_usd: 100,
        swap_upsell_surface: 'toggle',
        toggle_state: 'on',
        underlying_token_symbol: 'USDC',
      }),
    )
  })

  it('logs a new shown event when the swap amount changes', () => {
    mockSwapState.inputUsdValue = '100'
    mockEarnState({
      position: POSITION,
      positionStatus: EarnPositionStatus.Present,
    })

    const { rerender } = renderWithProviders(<EarnSwapToggle />)
    vi.mocked(sendAnalyticsEvent).mockClear()
    mockSwapState.inputUsdValue = '250'

    rerender(<EarnSwapToggle />)

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      EarnEventName.EarnSwapUpsellToggleShown,
      expect.objectContaining({
        swap_amount_usd: 250,
        toggle_state: 'on',
      }),
    )
  })

  it('logs when the user changes the earn swap toggle', () => {
    mockSwapState.inputUsdValue = '100'
    mockEarnState({
      position: POSITION,
      positionStatus: EarnPositionStatus.Present,
    })

    const { getByTestId } = renderWithProviders(<EarnSwapToggle />)
    vi.mocked(sendAnalyticsEvent).mockClear()

    fireEvent.press(getByTestId('earn-swap-toggle-switch'))

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      EarnEventName.EarnSwapUpsellToggleChanged,
      expect.objectContaining({
        swap_upsell_surface: 'toggle',
        toggle_state: 'off',
      }),
    )
    expect(mockUpdateSwapForm).toHaveBeenCalledWith({
      isEarnFlow: false,
      earnSwapUpsellAnalyticsProperties: undefined,
    })
  })
})
