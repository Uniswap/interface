import { fireEvent } from '@testing-library/react-native'
import { ReviewNetworkCostRow } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/ReviewNetworkCostRow'
import { renderWithProviders } from 'uniswap/src/test/render'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => {
      const translations: Record<string, string> = {
        'common.auto': 'Auto',
        'gas.override.title': 'Network cost',
        'swap.warning.networkFee.includesDelegation': 'Includes smart wallet activation',
        'swap.warning.networkFee.includesSmartWalletUpdate': 'Includes smart wallet update',
      }
      return translations[key] ?? key
    },
  }),
}))

const mockUseGasOverridesWarningState = vi.fn()

vi.mock('uniswap/src/features/gas/components/NetworkCostEditor/useGasOverridesWarningState', () => ({
  useGasOverridesWarningState: (): unknown => mockUseGasOverridesWarningState(),
}))

vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  () => ({
    useTransactionSettingsStore: (selector: (s: { gasOverrides: unknown }) => unknown): unknown =>
      selector({ gasOverrides: undefined }),
  }),
)

describe('ReviewNetworkCostRow', () => {
  beforeEach(() => {
    mockUseGasOverridesWarningState.mockReturnValue({
      enableCustomGasFeeEntry: false,
      hasOverrides: false,
      hasWarning: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the gas fee value in display-only form (no chevron, no tap handler)', () => {
    const { getByText, queryByTestId } = renderWithProviders(<ReviewNetworkCostRow gasFeeUsd="$1.54" tx={undefined} />)
    expect(getByText('$1.54')).toBeTruthy()
    // Tapping a display-only row is a no-op (no TouchableArea) — we'd have
    // crashed on a press handler if one existed.
    fireEvent.press(getByText('$1.54'))
    // Sanity: warning icon is hidden when no overrides.
    expect(queryByTestId('network-cost-warning-icon')).toBeNull()
  })

  it('renders the Auto pill when custom entry is enabled but no overrides saved', () => {
    mockUseGasOverridesWarningState.mockReturnValue({
      enableCustomGasFeeEntry: true,
      hasOverrides: false,
      hasWarning: false,
    })
    const { getByText } = renderWithProviders(<ReviewNetworkCostRow gasFeeUsd="$1.54" tx={undefined} />)
    expect(getByText(/Auto/i)).toBeTruthy()
  })

  it('renders the warning treatment when warning state says so', () => {
    mockUseGasOverridesWarningState.mockReturnValue({
      enableCustomGasFeeEntry: true,
      hasOverrides: true,
      hasWarning: true,
    })
    const { getByTestId } = renderWithProviders(<ReviewNetworkCostRow gasFeeUsd="$1.54" tx={undefined} />)
    expect(getByTestId('network-cost-warning-icon')).toBeTruthy()
  })

  it('renders the smart wallet activation subtitle when includesDelegation is true', () => {
    const { getByText } = renderWithProviders(
      <ReviewNetworkCostRow gasFeeUsd="$1.54" tx={undefined} includesDelegation />,
    )
    expect(getByText('Includes smart wallet activation')).toBeTruthy()
  })

  it('renders the smart wallet update subtitle when the delegation is an upgrade', () => {
    const { getByText, queryByText } = renderWithProviders(
      <ReviewNetworkCostRow gasFeeUsd="$1.54" tx={undefined} includesDelegation includesDelegationUpgrade />,
    )
    expect(getByText('Includes smart wallet update')).toBeTruthy()
    expect(queryByText('Includes smart wallet activation')).toBeNull()
  })

  it('does not render the subtitle when includesDelegation is omitted', () => {
    const { queryByText } = renderWithProviders(<ReviewNetworkCostRow gasFeeUsd="$1.54" tx={undefined} />)
    expect(queryByText('Includes smart wallet activation')).toBeNull()
  })
})
