import { fireEvent } from '@testing-library/react-native'
import type { providers } from 'ethers/lib/ethers'
import { NetworkCostEditor } from 'uniswap/src/features/gas/components/NetworkCostEditor/NetworkCostEditor'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { renderWithProviders } from 'uniswap/src/test/render'

// Use vi.hoisted to create mutable mock state for isMobileApp so individual
// tests can flip the platform polarity without vi.resetModules.
const { mockIsMobileApp, mockMaxCostUsd } = vi.hoisted(() => ({
  mockIsMobileApp: { value: false },
  mockMaxCostUsd: { value: '1.23' as string | undefined },
}))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isMobileApp(): boolean {
      return mockIsMobileApp.value
    },
  }
})

// The Tooltip variant uses Modal on native / Popover on web; neither matters for
// editor-level behavior. Stub it out to keep the test focused on the surrounding fields.
vi.mock('uniswap/src/features/gas/components/NetworkCostEditor/GasFieldTooltip', () => ({
  GasFieldTooltip: (): null => null,
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

vi.mock('uniswap/src/features/gas/components/NetworkCostEditor/useRecommendedGasFields', () => ({
  useRecommendedGasFields: (): {
    recommendedMaxBaseFeeGwei: string
    recommendedPriorityFeeGwei: string
    recommendedGasLimit: string
    currentNetworkBaseFeeGwei: string
    isLoading: boolean
  } => ({
    recommendedMaxBaseFeeGwei: '3.21',
    recommendedPriorityFeeGwei: '2',
    recommendedGasLimit: '169698',
    currentNetworkBaseFeeGwei: '3.21',
    isLoading: false,
  }),
}))

vi.mock('uniswap/src/features/gas/hooks', () => ({
  useUSDValueOfGasFee: (): { isLoading: boolean; value: string | undefined } => ({
    isLoading: false,
    value: mockMaxCostUsd.value,
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string, vars?: Record<string, unknown>) => string } => ({
    t: (key: string, vars?: Record<string, unknown>): string => {
      const translations: Record<string, string> = {
        'common.button.cancel': 'Cancel',
        'common.button.reset': 'Reset',
        'common.button.save': 'Save',
        'gas.override.auto': 'Auto: {{value}}',
        'gas.override.current': 'Current: {{value}}',
        'gas.override.error.invalidNumber': 'Enter a valid number',
        'gas.override.error.maxBaseBelowCurrent': 'Must be greater than current base fee ({{value}} GWEI)',
        'gas.override.field.gasLimit': 'Gas limit',
        'gas.override.field.maxBaseFee': 'Max base fee',
        'gas.override.field.priorityFee': 'Priority fee',
        'gas.override.maxCost': 'Max cost',
        'gas.override.title': 'Network cost',
        'gas.override.warning.priorityFeeLow':
          'This transaction may take a while to process. Consider a higher priority fee.',
      }
      let result = translations[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          result = result.replace(`{{${k}}}`, String(v))
        }
      }
      return result
    },
  }),
}))

const fakeTx = (): providers.TransactionRequest =>
  ({ chainId: 1, from: '0x1', to: '0x2' }) as providers.TransactionRequest

/** A populated tx — same shape the trading API returns and what the on-chain
 *  submission reads from. Pre-fill priority puts these ahead of `recommended`. */
const populatedTx = (): providers.TransactionRequest =>
  ({
    chainId: 1,
    from: '0x1',
    to: '0x2',
    maxFeePerGas: '7000000000', // 7 GWEI total
    maxPriorityFeePerGas: '1000000000', // 1 GWEI prio → 6 GWEI base
    gasLimit: '210000',
  }) as providers.TransactionRequest

describe('NetworkCostEditor', () => {
  beforeEach(() => {
    vi.mocked(sendAnalyticsEvent).mockClear()
    mockMaxCostUsd.value = '1.23'
  })

  it('pre-fills inputs with the recommended values when the tx has no gas fields', () => {
    const { getByDisplayValue } = renderWithProviders(
      <NetworkCostEditor tx={fakeTx()} onSave={vi.fn()} onCancel={vi.fn()} onReset={vi.fn()} surface="swap_form" />,
    )
    expect(getByDisplayValue('3.21')).toBeTruthy()
    expect(getByDisplayValue('2')).toBeTruthy()
    expect(getByDisplayValue('169698')).toBeTruthy()
  })

  it('pre-fills inputs from the populated tx when its gas fields are set', () => {
    const { getByDisplayValue } = renderWithProviders(
      <NetworkCostEditor
        tx={populatedTx()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onReset={vi.fn()}
        surface="swap_form"
      />,
    )
    // 7 - 1 = 6 GWEI max base, 1 GWEI prio, 210000 gas limit — derived from the
    // tx, not the gas-service recommended.
    expect(getByDisplayValue('6')).toBeTruthy()
    expect(getByDisplayValue('1')).toBeTruthy()
    expect(getByDisplayValue('210000')).toBeTruthy()
  })

  it('preserves sub-GWEI precision when pre-filling from the tx', () => {
    // Real values from a live /swap response — base = 0.16982097 GWEI,
    // prio = 1 GWEI. Before the weiToGwei fix the max base displayed as "0".
    const subGweiTx = {
      chainId: 1,
      from: '0x1',
      to: '0x2',
      maxFeePerGas: '1169820970',
      maxPriorityFeePerGas: '1000000000',
      gasLimit: '178442',
    } as providers.TransactionRequest
    const { getByDisplayValue } = renderWithProviders(
      <NetworkCostEditor tx={subGweiTx} onSave={vi.fn()} onCancel={vi.fn()} onReset={vi.fn()} surface="swap_form" />,
    )
    expect(getByDisplayValue('0.16982097')).toBeTruthy()
    expect(getByDisplayValue('1')).toBeTruthy()
    expect(getByDisplayValue('178442')).toBeTruthy()
  })

  it('does not call onSave when max base fee is below current network base fee', () => {
    const onSave = vi.fn()
    const { getByDisplayValue, getByText } = renderWithProviders(
      <NetworkCostEditor tx={fakeTx()} onSave={onSave} onCancel={vi.fn()} onReset={vi.fn()} surface="swap_form" />,
    )
    fireEvent.changeText(getByDisplayValue('3.21'), '1')
    fireEvent.press(getByText('Save'))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onSave with only the dirty fields (partial override)', () => {
    const onSave = vi.fn()
    const { getByDisplayValue, getByText } = renderWithProviders(
      <NetworkCostEditor tx={fakeTx()} onSave={onSave} onCancel={vi.fn()} onReset={vi.fn()} surface="swap_form" />,
    )
    // Only change maxBaseFee — priorityFee and gasLimit should NOT be in the saved override
    fireEvent.changeText(getByDisplayValue('3.21'), '5')
    fireEvent.press(getByText('Save'))
    expect(onSave).toHaveBeenCalledWith({ maxBaseFeeGwei: '5' })
  })

  it('Reset button invokes onReset (parent clears overrides and closes)', () => {
    const onReset = vi.fn()
    // Reset is only visible when the editor opens with saved overrides or when a
    // field has been dirtied. Pass initialOverrides so it renders immediately.
    const { getByText } = renderWithProviders(
      <NetworkCostEditor
        tx={fakeTx()}
        initialOverrides={{ priorityFeeGwei: '8.00' }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onReset={onReset}
        surface="swap_form"
      />,
    )
    fireEvent.press(getByText('Reset'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    const { getByText } = renderWithProviders(
      <NetworkCostEditor tx={fakeTx()} onSave={vi.fn()} onCancel={onCancel} onReset={vi.fn()} surface="swap_form" />,
    )
    fireEvent.press(getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('honors initialOverrides over the tx-derived values and the recommended values', () => {
    const { getByDisplayValue } = renderWithProviders(
      <NetworkCostEditor
        tx={populatedTx()}
        initialOverrides={{ maxBaseFeeGwei: '9', priorityFeeGwei: '3', gasLimit: '250000' }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onReset={vi.fn()}
        surface="swap_form"
      />,
    )
    expect(getByDisplayValue('9')).toBeTruthy()
    expect(getByDisplayValue('3')).toBeTruthy()
    expect(getByDisplayValue('250000')).toBeTruthy()
  })

  it('fires CustomGasOverridesApplied analytics event on save', () => {
    const onSave = vi.fn()
    const { getByDisplayValue, getByText } = renderWithProviders(
      <NetworkCostEditor tx={fakeTx()} onSave={onSave} onCancel={vi.fn()} onReset={vi.fn()} surface="swap_form" />,
    )
    fireEvent.changeText(getByDisplayValue('3.21'), '5')
    fireEvent.press(getByText('Save'))
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(WalletEventName.CustomGasOverridesApplied, {
      chainId: 1,
      hasMaxBaseFeeOverride: true,
      hasPriorityFeeOverride: false,
      hasGasLimitOverride: false,
      hasWarning: false,
      surface: 'swap_form',
    })
  })

  it('does not fire analytics event when save is blocked by validation', () => {
    const onSave = vi.fn()
    const { getByDisplayValue, getByText } = renderWithProviders(
      <NetworkCostEditor tx={fakeTx()} onSave={onSave} onCancel={vi.fn()} onReset={vi.fn()} surface="swap_form" />,
    )
    fireEvent.changeText(getByDisplayValue('3.21'), '1')
    fireEvent.press(getByText('Save'))
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('renders the Max cost line with native token amount and USD', async () => {
    const tx = {
      maxFeePerGas: '9920000000', // 3.87 base + 6.05 priority = 9.92 GWEI
      maxPriorityFeePerGas: '6050000000',
      gasLimit: '169698',
      chainId: 1, // UniverseChainId.Mainnet
    } as providers.TransactionRequest
    const { findByText } = renderWithProviders(
      <NetworkCostEditor
        tx={tx}
        chainId={1}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onReset={vi.fn()}
        surface="swap_form"
      />,
    )
    // Token symbol (ETH on Mainnet) appears in the Max cost row
    expect(await findByText(/ETH/)).toBeTruthy()
    // USD value still renders ($ sign present)
    expect(await findByText(/\$/)).toBeTruthy()
  })

  it('caps the Max cost fiat value at two decimals', async () => {
    // A full-precision USD value must render as "$X.XX", not the raw string.
    mockMaxCostUsd.value = '18.448'
    const { findByText, queryByText } = renderWithProviders(
      <NetworkCostEditor
        tx={fakeTx()}
        chainId={1}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onReset={vi.fn()}
        surface="swap_form"
      />,
    )
    expect(await findByText('$18.45')).toBeTruthy()
    expect(queryByText('$18.448')).toBeNull()
  })

  it('renders the Max cost fiat value as "<$0.01" when below a cent', async () => {
    mockMaxCostUsd.value = '0.004'
    const { findByText } = renderWithProviders(
      <NetworkCostEditor
        tx={fakeTx()}
        chainId={1}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onReset={vi.fn()}
        surface="swap_form"
      />,
    )
    expect(await findByText('<$0.01')).toBeTruthy()
  })

  // ---------------------------------------------------------------------------
  // Dirty-state gating tests
  // ---------------------------------------------------------------------------

  it('does NOT render Reset on initial open with no overrides', () => {
    const { queryByText } = renderWithProviders(
      <NetworkCostEditor tx={fakeTx()} surface="swap_form" onSave={vi.fn()} onCancel={vi.fn()} onReset={vi.fn()} />,
    )
    expect(queryByText('Reset')).toBeNull()
  })

  it('renders Reset when the editor opens with saved overrides', () => {
    const { getByText } = renderWithProviders(
      <NetworkCostEditor
        tx={fakeTx()}
        initialOverrides={{ priorityFeeGwei: '8.00' }}
        surface="swap_form"
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(getByText('Reset')).toBeTruthy()
  })

  it('renders Reset after the user types into any field', () => {
    const { getByLabelText, queryByText, getByText } = renderWithProviders(
      <NetworkCostEditor tx={fakeTx()} surface="swap_form" onSave={vi.fn()} onCancel={vi.fn()} onReset={vi.fn()} />,
    )
    expect(queryByText('Reset')).toBeNull()
    fireEvent.changeText(getByLabelText('Priority fee'), '10')
    expect(getByText('Reset')).toBeTruthy()
  })

  it('does not call onSave when no field has been edited (Save is gated on dirty state)', () => {
    const onSave = vi.fn()
    const { getByText } = renderWithProviders(
      <NetworkCostEditor tx={fakeTx()} surface="swap_form" onSave={onSave} onCancel={vi.fn()} onReset={vi.fn()} />,
    )
    // Press Save without editing any field — should be a no-op
    fireEvent.press(getByText('Save'))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onSave once a field has been edited and values are valid', () => {
    const onSave = vi.fn()
    const { getByLabelText, getByText } = renderWithProviders(
      <NetworkCostEditor tx={fakeTx()} surface="swap_form" onSave={onSave} onCancel={vi.fn()} onReset={vi.fn()} />,
    )
    fireEvent.changeText(getByLabelText('Priority fee'), '5')
    fireEvent.press(getByText('Save'))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('renders the Close X on non-mobile platforms', () => {
    // isMobileApp defaults to false via the module-level mock (web/extension path)
    const { getByTestId } = renderWithProviders(
      <NetworkCostEditor tx={fakeTx()} surface="swap_form" onSave={vi.fn()} onCancel={vi.fn()} onReset={vi.fn()} />,
    )
    expect(getByTestId('network-cost-editor-close')).toBeTruthy()
  })

  it('does NOT render the Close X on mobile', () => {
    mockIsMobileApp.value = true
    try {
      const { queryByTestId } = renderWithProviders(
        <NetworkCostEditor tx={fakeTx()} surface="swap_form" onSave={vi.fn()} onCancel={vi.fn()} onReset={vi.fn()} />,
      )
      expect(queryByTestId('network-cost-editor-close')).toBeNull()
    } finally {
      mockIsMobileApp.value = false
    }
  })

  // ---------------------------------------------------------------------------
  // Per-field partial override tests
  // ---------------------------------------------------------------------------

  it('emits an override containing only fields the user typed in', () => {
    const onSave = vi.fn()
    const { getByLabelText, getByText } = renderWithProviders(
      <NetworkCostEditor
        tx={fakeTx()}
        chainId={1}
        onSave={onSave}
        onCancel={vi.fn()}
        onReset={vi.fn()}
        surface="swap_form"
      />,
    )
    fireEvent.changeText(getByLabelText('Priority fee'), '8.00')
    fireEvent.press(getByText('Save'))
    expect(onSave).toHaveBeenCalledWith({ priorityFeeGwei: '8.00' })
  })

  it('preserves an existing override field the user did not touch this session', () => {
    const onSave = vi.fn()
    const { getByLabelText, getByText } = renderWithProviders(
      <NetworkCostEditor
        tx={fakeTx()}
        chainId={1}
        initialOverrides={{ priorityFeeGwei: '8.00' }}
        surface="swap_form"
        onSave={onSave}
        onCancel={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    fireEvent.changeText(getByLabelText('Gas limit'), '300000')
    fireEvent.press(getByText('Save'))
    expect(onSave).toHaveBeenCalledWith({ priorityFeeGwei: '8.00', gasLimit: '300000' })
  })
})
