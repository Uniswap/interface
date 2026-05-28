import { fireEvent } from '@testing-library/react-native'
import type { GasFeeResult } from '@universe/api'
import { View } from 'react-native'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useGasOverridesWarningState } from 'uniswap/src/features/gas/components/NetworkCostEditor/useGasOverridesWarningState'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { GasInfoRowWithCustomGasEnabled } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/GasInfoRowWithCustomGasEnabled'
import type { GasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/types'
import { useFormGasOverridesController } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/useFormGasOverridesController'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { renderWithProviders } from 'uniswap/src/test/render'
import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => {
      const translations: Record<string, string> = {
        'common.auto': 'Auto',
      }
      return translations[key] ?? key
    },
  }),
}))

vi.mock('uniswap/src/features/transactions/swap/form/SwapFormScreen/useFormGasOverridesController')
vi.mock('uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore')
vi.mock('uniswap/src/features/gas/components/NetworkCostEditor/useGasOverridesWarningState')
vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
)

const mockUseFormGasOverridesController = vi.mocked(useFormGasOverridesController)
const mockUseSwapTxStore = vi.mocked(useSwapTxStore)
const mockUseGasOverridesWarningState = vi.mocked(useGasOverridesWarningState)
const mockUseTransactionSettingsStore = vi.mocked(useTransactionSettingsStore)

const baseGasInfo: GasInfo = {
  gasFee: { value: '1000', isLoading: false, error: null } as unknown as GasFeeResult,
  fiatPriceFormatted: '$1.23',
  isHighRelativeToValue: false,
  isLoading: false,
  chainId: UniverseChainId.Mainnet,
  uniswapXGasFeeInfo: undefined,
}

describe('GasInfoRowWithCustomGasEnabled', () => {
  const onPress = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSwapTxStore.mockImplementation(((selector: (s: unknown) => unknown) =>
      selector({ routing: 'CLASSIC', txRequests: undefined })) as typeof useSwapTxStore)
    mockUseTransactionSettingsStore.mockImplementation(((selector: (s: { gasOverrides: undefined }) => unknown) =>
      selector({ gasOverrides: undefined })) as typeof useTransactionSettingsStore)
    mockUseGasOverridesWarningState.mockReturnValue({
      enableCustomGasFeeEntry: true,
      hasOverrides: false,
      hasWarning: false,
    })
    mockUseFormGasOverridesController.mockReturnValue({
      onPress,
      onCloseModal: vi.fn(),
      onResetOverrides: vi.fn(),
      isEditorOpen: false,
      isAutoTooltipOpen: false,
      isCrosschainOpen: false,
      modals: null,
    })
  })

  it('renders the formatted gas price', () => {
    const { getByText } = renderWithProviders(<GasInfoRowWithCustomGasEnabled gasInfo={baseGasInfo} />)
    expect(getByText('$1.23')).toBeTruthy()
  })

  it('hides the tappable chip when fiatPriceFormatted is missing', () => {
    const { queryByTestId } = renderWithProviders(
      <GasInfoRowWithCustomGasEnabled gasInfo={{ ...baseGasInfo, fiatPriceFormatted: undefined }} />,
    )
    expect(queryByTestId('gas-info-row-custom-gas')).toBeNull()
  })

  // Regression test for SWAP-2688: the modal subtree must survive a transient
  // `!fiatPriceFormatted` state (e.g. during a /swap refetch on a new query
  // key). If the chip returns `null` outright, the open editor sheet unmounts,
  // user input + isDirty are wiped, and Save/Reset stop working.
  it('keeps modals mounted when fiatPriceFormatted is missing so an open editor survives a poll', () => {
    mockUseFormGasOverridesController.mockReturnValue({
      onPress: vi.fn(),
      onCloseModal: vi.fn(),
      onResetOverrides: vi.fn(),
      isEditorOpen: true,
      isAutoTooltipOpen: false,
      isCrosschainOpen: false,
      modals: <View testID="custom-gas-modals-sentinel" />,
    })
    const { queryByTestId } = renderWithProviders(
      <GasInfoRowWithCustomGasEnabled gasInfo={{ ...baseGasInfo, fiatPriceFormatted: undefined }} />,
    )
    expect(queryByTestId('gas-info-row-custom-gas')).toBeNull()
    expect(queryByTestId('custom-gas-modals-sentinel')).not.toBeNull()
  })

  it('renders the "Auto" pill and no chevron when no overrides are saved', () => {
    mockUseGasOverridesWarningState.mockReturnValue({
      enableCustomGasFeeEntry: true,
      hasOverrides: false,
      hasWarning: false,
    })
    const { getByText, queryByTestId } = renderWithProviders(<GasInfoRowWithCustomGasEnabled gasInfo={baseGasInfo} />)
    expect(getByText('Auto')).toBeTruthy()
    expect(queryByTestId('gas-info-row-custom-gas-chevron')).toBeNull()
  })

  it('renders the chevron and no "Auto" pill when overrides are saved', () => {
    mockUseGasOverridesWarningState.mockReturnValue({
      enableCustomGasFeeEntry: true,
      hasOverrides: true,
      hasWarning: false,
    })
    const { queryByText, getByTestId } = renderWithProviders(<GasInfoRowWithCustomGasEnabled gasInfo={baseGasInfo} />)
    expect(queryByText('Auto')).toBeNull()
    expect(getByTestId('gas-info-row-custom-gas-chevron')).toBeTruthy()
  })

  it('renders the amber warning icon when overrides trigger a warning', () => {
    mockUseGasOverridesWarningState.mockReturnValue({
      enableCustomGasFeeEntry: true,
      hasOverrides: true,
      hasWarning: true,
    })
    const { getByTestId } = renderWithProviders(<GasInfoRowWithCustomGasEnabled gasInfo={baseGasInfo} />)
    expect(getByTestId('gas-info-row-custom-gas-warning-icon')).toBeTruthy()
  })

  it('calls controller.onPress when the chip is tapped', () => {
    const { getByTestId } = renderWithProviders(<GasInfoRowWithCustomGasEnabled gasInfo={baseGasInfo} />)
    fireEvent.press(getByTestId('gas-info-row-custom-gas'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not render the tappable chip for UniswapX trades', () => {
    mockUseSwapTxStore.mockImplementation(((selector: (s: unknown) => unknown) =>
      selector({ routing: 'DUTCH_V2', gasFee: {}, gasFeeBreakdown: {} })) as typeof useSwapTxStore)
    const { queryByTestId } = renderWithProviders(
      <GasInfoRowWithCustomGasEnabled
        gasInfo={{
          ...baseGasInfo,
          uniswapXGasFeeInfo: { preSavingsGasFeeFormatted: '$5.00' } as GasInfo['uniswapXGasFeeInfo'],
        }}
      />,
    )
    expect(queryByTestId('gas-info-row-custom-gas')).toBeNull()
  })
})
