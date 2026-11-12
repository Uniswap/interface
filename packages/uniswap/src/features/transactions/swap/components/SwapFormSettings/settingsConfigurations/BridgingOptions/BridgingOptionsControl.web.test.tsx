import { TradingApi } from '@universe/api'
import { BridgingOptionsControl } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/BridgingOptions/BridgingOptionsControl'
import { renderWithProviders } from 'uniswap/src/test/render'

const { mockSettings } = vi.hoisted(() => {
  const selectedBridgeProviders: string[] = []
  return { mockSettings: { selectedBridgeProviders } }
})

// vitest-setup mocks this hook with slippage and deadline only; the selection under test is added here.
vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  () => ({
    useTransactionSettingsStore: (selector: (state: typeof mockSettings) => unknown) => selector(mockSettings),
  }),
)

const { ACROSS, RELAY } = TradingApi.BridgeProvider

describe(BridgingOptionsControl, () => {
  it.each([
    { selected: [ACROSS, RELAY], label: 'common.all' },
    { selected: [ACROSS], label: 'common.custom' },
    { selected: [RELAY], label: 'common.custom' },
  ])('reads $label for $selected', ({ selected, label }) => {
    mockSettings.selectedBridgeProviders = selected

    const { queryByText } = renderWithProviders(<BridgingOptionsControl />)

    expect(queryByText(label)).toBeTruthy()
  })
})
