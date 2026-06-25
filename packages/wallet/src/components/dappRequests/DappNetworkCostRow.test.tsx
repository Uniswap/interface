import { fireEvent } from '@testing-library/react-native'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { DappNetworkCostRow } from 'wallet/src/components/dappRequests/DappNetworkCostRow'
import { renderWithProviders } from 'wallet/src/test/render'

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => {
      const translations: Record<string, string> = {
        'common.auto': 'Auto',
        'gas.override.title': 'Network cost',
        'swap.warning.networkFee.includesDelegation': 'Includes smart wallet activation',
      }
      return translations[key] ?? key
    },
  }),
}))

const mockDispatch = jest.fn()
const mockUseGasOverridesWarningState = jest.fn()

jest.mock('uniswap/src/features/gas/components/NetworkCostEditor/useGasOverridesWarningState', () => ({
  useGasOverridesWarningState: (): unknown => mockUseGasOverridesWarningState(),
}))

jest.mock('uniswap/src/features/gas/hooks/useGasChipDispatch', () => ({
  useGasChipDispatch: (): { dispatch: () => unknown } => ({ dispatch: mockDispatch }),
}))

jest.mock('uniswap/src/features/gas/hooks', () => ({
  useGasFeeFormattedDisplayAmounts: (): { gasFeeFormatted: string } => ({ gasFeeFormatted: '$1.54' }),
}))

// The companion modals render via Portal — stub them so we can assert open
// state without spinning up the full Modal lifecycle.
jest.mock('uniswap/src/features/gas/components/NetworkCostEditor/NetworkCostEditorModal', () => ({
  NetworkCostEditorModal: ({ isOpen }: { isOpen: boolean }): JSX.Element | null => (isOpen ? <>editor-open</> : null),
}))
jest.mock('uniswap/src/features/gas/components/AutoGasTooltipModal', () => ({
  AutoGasTooltipModal: ({ isOpen }: { isOpen: boolean }): JSX.Element | null =>
    isOpen ? <>auto-tooltip-open</> : null,
}))

describe('DappNetworkCostRow', () => {
  beforeEach(() => {
    mockUseGasOverridesWarningState.mockReturnValue({
      enableCustomGasFeeEntry: false,
      hasOverrides: false,
      hasWarning: false,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('dispatches to the gas chip when the row is pressed', () => {
    mockDispatch.mockReturnValue({ type: 'auto-tooltip' })
    const { getByText } = renderWithProviders(
      <DappNetworkCostRow
        chainId={1}
        gasFee={undefined}
        tx={undefined}
        gasOverrides={undefined}
        onChangeGasOverrides={jest.fn()}
      />,
    )
    fireEvent.press(getByText('$1.54'), ON_PRESS_EVENT_PAYLOAD)
    expect(mockDispatch).toHaveBeenCalled()
  })

  it('renders the warning treatment when warning state says so', () => {
    mockUseGasOverridesWarningState.mockReturnValue({
      enableCustomGasFeeEntry: true,
      hasOverrides: true,
      hasWarning: true,
    })
    const { getByTestId } = renderWithProviders(
      <DappNetworkCostRow
        chainId={1}
        gasFee={undefined}
        tx={undefined}
        gasOverrides={{ maxBaseFeeGwei: '1', priorityFeeGwei: '1', gasLimit: '21000' }}
        onChangeGasOverrides={jest.fn()}
      />,
    )
    expect(getByTestId('network-cost-warning-icon')).toBeTruthy()
  })

  it('renders the gas fee value from useGasFeeFormattedDisplayAmounts', () => {
    const { getByText } = renderWithProviders(
      <DappNetworkCostRow
        chainId={1}
        gasFee={undefined}
        tx={undefined}
        gasOverrides={undefined}
        onChangeGasOverrides={jest.fn()}
      />,
    )
    expect(getByText('$1.54')).toBeTruthy()
  })

  it('renders the smart wallet activation subtitle when showSmartWalletActivation is true', () => {
    const { getByText } = renderWithProviders(
      <DappNetworkCostRow
        chainId={1}
        gasFee={undefined}
        tx={undefined}
        showSmartWalletActivation
        gasOverrides={undefined}
        onChangeGasOverrides={jest.fn()}
      />,
    )
    expect(getByText('Includes smart wallet activation')).toBeTruthy()
  })

  it('does not render the subtitle when showSmartWalletActivation is omitted', () => {
    const { queryByText } = renderWithProviders(
      <DappNetworkCostRow
        chainId={1}
        gasFee={undefined}
        tx={undefined}
        gasOverrides={undefined}
        onChangeGasOverrides={jest.fn()}
      />,
    )
    expect(queryByText('Includes smart wallet activation')).toBeNull()
  })
})
