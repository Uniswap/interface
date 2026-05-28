import { fireEvent } from '@testing-library/react-native'
import type { GasFeeResult } from '@universe/api'
import type { providers } from 'ethers/lib/ethers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FormNetworkCostRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/FormNetworkCostRow'
import { renderWithProviders } from 'uniswap/src/test/render'

const mockSetGasOverrides = vi.fn()
const mockDispatch = vi.fn()
const mockUseSwapFormScreenStore = vi.fn()
const mockUseGasOverridesWarningState = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => {
      const translations: Record<string, string> = {
        'common.auto': 'Auto',
        'gas.override.title': 'Network cost',
      }
      return translations[key] ?? key
    },
  }),
}))

vi.mock('uniswap/src/features/gas/hooks/useGasChipDispatch', () => ({
  useGasChipDispatch: (): { dispatch: () => unknown } => ({ dispatch: mockDispatch }),
}))

vi.mock('uniswap/src/features/gas/components/NetworkCostEditor/useGasOverridesWarningState', () => ({
  useGasOverridesWarningState: (): unknown => mockUseGasOverridesWarningState(),
}))

vi.mock('uniswap/src/features/gas/hooks', () => ({
  useGasFeeFormattedDisplayAmounts: (): { gasFeeFormatted: string | null; gasFeeUSD: string | undefined } => ({
    gasFeeFormatted: '$1.54',
    gasFeeUSD: '1.54',
  }),
}))

vi.mock('uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore', () => ({
  useSwapFormScreenStore: (selector: (s: { isCrossChain: boolean }) => unknown): unknown =>
    selector(mockUseSwapFormScreenStore()),
}))

vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  () => ({
    useTransactionSettingsStore: (selector: (s: { gasOverrides: unknown }) => unknown): unknown =>
      selector({ gasOverrides: undefined }),
    useTransactionSettingsActions: (): { setGasOverrides: typeof mockSetGasOverrides } => ({
      setGasOverrides: mockSetGasOverrides,
    }),
  }),
)

// Capture the modal's props so we can verify what gets threaded through.
const mockEditorOnReset = vi.fn()
let capturedEditorProps: { isOpen: boolean; tx: unknown; onReset: () => void } | undefined

vi.mock('uniswap/src/features/gas/components/NetworkCostEditor/NetworkCostEditorModal', () => ({
  NetworkCostEditorModal: (props: { isOpen: boolean; tx: unknown; onReset: () => void }): JSX.Element | null => {
    capturedEditorProps = props
    return props.isOpen ? (
      <>
        <span>editor-open</span>
        <span onClick={props.onReset}>__test__trigger-reset</span>
      </>
    ) : null
  },
}))
vi.mock('uniswap/src/features/gas/components/AutoGasTooltipModal', () => ({
  AutoGasTooltipModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <>auto-tooltip-open</> : null),
}))
vi.mock('uniswap/src/features/gas/components/CrosschainNotSupportedModal', () => ({
  CrosschainNotSupportedModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <>crosschain-open</> : null),
}))

const gasFee: GasFeeResult = {
  value: '1000000000000000',
  isLoading: false,
  error: null,
}

const tx = { chainId: 1, from: '0x1', to: '0x2' } as providers.TransactionRequest

describe('FormNetworkCostRow', () => {
  beforeEach(() => {
    mockUseSwapFormScreenStore.mockReturnValue({ isCrossChain: false })
    mockUseGasOverridesWarningState.mockReturnValue({
      enableCustomGasFeeEntry: false,
      hasOverrides: false,
      hasWarning: false,
    })
    capturedEditorProps = undefined
    mockEditorOnReset.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('opens the auto tooltip when dispatch returns auto-tooltip', () => {
    mockDispatch.mockReturnValue({ type: 'auto-tooltip' })
    const { getByText, queryByText } = renderWithProviders(
      <FormNetworkCostRow gasFee={gasFee} tx={tx} chainId={UniverseChainId.Mainnet} />,
    )
    fireEvent.press(getByText('$1.54'))
    expect(queryByText('auto-tooltip-open')).toBeTruthy()
    expect(queryByText('editor-open')).toBeNull()
    expect(queryByText('crosschain-open')).toBeNull()
  })

  it('opens the editor modal when dispatch returns editor', () => {
    mockDispatch.mockReturnValue({ type: 'editor' })
    const { getByText, queryByText } = renderWithProviders(
      <FormNetworkCostRow gasFee={gasFee} tx={tx} chainId={UniverseChainId.Mainnet} />,
    )
    fireEvent.press(getByText('$1.54'))
    expect(queryByText('editor-open')).toBeTruthy()
    // The submission tx is threaded into the editor so it can pre-fill from
    // the same data the wallet will sign.
    expect(capturedEditorProps?.tx).toBe(tx)
  })

  it('opens the crosschain modal when dispatch returns crosschain-not-supported', () => {
    mockUseSwapFormScreenStore.mockReturnValue({ isCrossChain: true })
    mockDispatch.mockReturnValue({ type: 'crosschain-not-supported' })
    const { getByText, queryByText } = renderWithProviders(
      <FormNetworkCostRow gasFee={gasFee} tx={tx} chainId={UniverseChainId.Mainnet} />,
    )
    fireEvent.press(getByText('$1.54'))
    expect(queryByText('crosschain-open')).toBeTruthy()
  })

  it('renders the warning treatment when warning state says so', () => {
    mockUseGasOverridesWarningState.mockReturnValue({
      enableCustomGasFeeEntry: true,
      hasOverrides: true,
      hasWarning: true,
    })
    const { getByTestId } = renderWithProviders(
      <FormNetworkCostRow gasFee={gasFee} tx={tx} chainId={UniverseChainId.Mainnet} />,
    )
    expect(getByTestId('network-cost-warning-icon')).toBeTruthy()
  })

  it('Reset from the editor clears the saved override and closes the modal', () => {
    mockDispatch.mockReturnValue({ type: 'editor' })
    const { getByText, queryByText } = renderWithProviders(
      <FormNetworkCostRow gasFee={gasFee} tx={tx} chainId={UniverseChainId.Mainnet} />,
    )
    fireEvent.press(getByText('$1.54'))
    expect(queryByText('editor-open')).toBeTruthy()
    fireEvent.press(getByText('__test__trigger-reset'))
    expect(mockSetGasOverrides).toHaveBeenCalledWith(undefined)
    expect(queryByText('editor-open')).toBeNull()
  })
})
