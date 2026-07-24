import { fireEvent } from '@testing-library/react-native'
import type { GasFeeResult } from '@universe/api'
import { useEffect } from 'react'
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

  // The modal subtree must survive a transient `!fiatPriceFormatted` state
  // (e.g. a /swap refetch on a new query key) so an open editor sheet keeps its
  // typed input + isDirty instead of unmounting.
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

  // The modal subtree must NOT remount when `fiatPriceFormatted` toggles
  // defined/undefined/defined during a poll. A remount would wipe
  // `useFieldState`'s typed input + isDirty inside the editor (breaking
  // Save/Reset), so `mountCount` staying 1 across the flips proves the subtree
  // keeps a stable position.
  it('preserves the modal subtree across fiatPriceFormatted transitions during a poll', () => {
    let mountCount = 0
    function TrackedModal(): JSX.Element {
      useEffect(() => {
        mountCount += 1
      }, [])
      return <View testID="tracked-modal" />
    }

    mockUseFormGasOverridesController.mockReturnValue({
      onPress: vi.fn(),
      onCloseModal: vi.fn(),
      onResetOverrides: vi.fn(),
      isEditorOpen: true,
      isAutoTooltipOpen: false,
      isCrosschainOpen: false,
      modals: <TrackedModal />,
    })

    const { rerender, queryByTestId } = renderWithProviders(
      <GasInfoRowWithCustomGasEnabled gasInfo={{ ...baseGasInfo, fiatPriceFormatted: '$1.23' }} />,
    )
    expect(mountCount).toBe(1)
    expect(queryByTestId('tracked-modal')).not.toBeNull()

    // Simulate a /swap refetch that briefly clears fiatPriceFormatted.
    rerender(<GasInfoRowWithCustomGasEnabled gasInfo={{ ...baseGasInfo, fiatPriceFormatted: undefined }} />)
    expect(mountCount).toBe(1)
    expect(queryByTestId('tracked-modal')).not.toBeNull()

    // Simulate the refetch completing with a new gas value.
    rerender(<GasInfoRowWithCustomGasEnabled gasInfo={{ ...baseGasInfo, fiatPriceFormatted: '$1.45' }} />)
    expect(mountCount).toBe(1)
    expect(queryByTestId('tracked-modal')).not.toBeNull()
  })

  // Companion to the poll test: the modal subtree must also survive an
  // EVM↔UniswapX trade change. When the chip switches between its UniswapX and
  // normal layouts mid-edit, the modal must both stay present and keep a stable
  // position (`mountCount` stays 1).
  it('preserves the modal subtree across an EVM↔UniswapX trade change', () => {
    let mountCount = 0
    function TrackedModal(): JSX.Element {
      useEffect(() => {
        mountCount += 1
      }, [])
      return <View testID="tracked-modal" />
    }

    mockUseFormGasOverridesController.mockReturnValue({
      onPress: vi.fn(),
      onCloseModal: vi.fn(),
      onResetOverrides: vi.fn(),
      isEditorOpen: true,
      isAutoTooltipOpen: false,
      isCrosschainOpen: false,
      modals: <TrackedModal />,
    })

    // Start as a classic EVM trade with the editor open.
    mockUseSwapTxStore.mockImplementation(((selector: (s: unknown) => unknown) =>
      selector({ routing: 'CLASSIC', txRequests: undefined })) as typeof useSwapTxStore)
    const { rerender, queryByTestId } = renderWithProviders(<GasInfoRowWithCustomGasEnabled gasInfo={baseGasInfo} />)
    expect(mountCount).toBe(1)
    expect(queryByTestId('tracked-modal')).not.toBeNull()

    // Trade flips to a UniswapX route mid-edit.
    mockUseSwapTxStore.mockImplementation(((selector: (s: unknown) => unknown) =>
      selector({ routing: 'DUTCH_V2', gasFee: {}, gasFeeBreakdown: {} })) as typeof useSwapTxStore)
    rerender(
      <GasInfoRowWithCustomGasEnabled
        gasInfo={{
          ...baseGasInfo,
          uniswapXGasFeeInfo: { preSavingsGasFeeFormatted: '$5.00' } as GasInfo['uniswapXGasFeeInfo'],
        }}
      />,
    )
    expect(mountCount).toBe(1)
    expect(queryByTestId('tracked-modal')).not.toBeNull()

    // …and back to a classic EVM route.
    mockUseSwapTxStore.mockImplementation(((selector: (s: unknown) => unknown) =>
      selector({ routing: 'CLASSIC', txRequests: undefined })) as typeof useSwapTxStore)
    rerender(<GasInfoRowWithCustomGasEnabled gasInfo={baseGasInfo} />)
    expect(mountCount).toBe(1)
    expect(queryByTestId('tracked-modal')).not.toBeNull()
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

  // A UniswapX trade with no savings has nothing to show: no tappable chip and
  // no fallback fee render (the chip returns null on this path).
  it('renders nothing for a UniswapX trade without savings', () => {
    mockUseSwapTxStore.mockImplementation(((selector: (s: unknown) => unknown) =>
      selector({ routing: 'DUTCH_V2', gasFee: {}, gasFeeBreakdown: {} })) as typeof useSwapTxStore)
    const { queryByTestId, queryByText } = renderWithProviders(
      <GasInfoRowWithCustomGasEnabled gasInfo={{ ...baseGasInfo, uniswapXGasFeeInfo: undefined }} />,
    )
    expect(queryByTestId('gas-info-row-custom-gas')).toBeNull()
    expect(queryByText('$1.23')).toBeNull()
  })
})
