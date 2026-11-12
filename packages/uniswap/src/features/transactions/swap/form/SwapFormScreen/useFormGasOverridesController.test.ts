import { act, renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { useGasChipDispatch } from 'uniswap/src/features/gas/hooks/useGasChipDispatch'
import {
  useTransactionSettingsActions,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore'
import { useFormGasOverridesController } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/useFormGasOverridesController'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/features/gas/hooks/useGasChipDispatch')
vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
)
vi.mock('uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore')
vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore')
vi.mock('uniswap/src/features/gas/components/NetworkCostEditor/NetworkCostEditorModal', () => ({
  NetworkCostEditorModal: (): null => null,
}))
vi.mock('uniswap/src/features/gas/components/AutoGasTooltipModal', () => ({
  AutoGasTooltipModal: (): null => null,
}))
vi.mock('uniswap/src/features/gas/components/CrosschainNotSupportedModal', () => ({
  CrosschainNotSupportedModal: (): null => null,
}))
vi.mock('utilities/src/react/hooks', () => ({
  useEvent: vi.fn((fn) => fn),
}))

const mockUseGasChipDispatch = useGasChipDispatch as Mock
const mockUseTransactionSettingsStore = useTransactionSettingsStore as unknown as Mock
const mockUseTransactionSettingsActions = useTransactionSettingsActions as Mock
const mockUseSwapFormScreenStore = useSwapFormScreenStore as unknown as Mock
const mockUseSwapFormStore = useSwapFormStore as unknown as Mock
const mockUseSwapFormStoreDerivedSwapInfo = useSwapFormStoreDerivedSwapInfo as unknown as Mock

describe('useFormGasOverridesController', () => {
  const setGasOverrides = vi.fn()
  const updateSwapForm = vi.fn()
  let focusOnCurrencyField: 'input' | 'output' | undefined

  beforeEach(() => {
    focusOnCurrencyField = 'input'
    vi.clearAllMocks()
    mockUseTransactionSettingsStore.mockImplementation((selector: (s: { gasOverrides: undefined }) => unknown) =>
      selector({ gasOverrides: undefined }),
    )
    mockUseTransactionSettingsActions.mockReturnValue({ setGasOverrides })
    mockUseSwapFormScreenStore.mockImplementation((selector: (s: { isCrossChain: boolean }) => unknown) =>
      selector({ isCrossChain: false }),
    )
    mockUseSwapFormStore.mockImplementation(
      (
        selector: (s: {
          updateSwapForm: typeof updateSwapForm
          focusOnCurrencyField: typeof focusOnCurrencyField
        }) => unknown,
      ) => selector({ updateSwapForm, focusOnCurrencyField }),
    )
    // No trade/quote → no quote-derived fallback (these tests only assert modal state).
    mockUseSwapFormStoreDerivedSwapInfo.mockImplementation(
      (selector: (s: { trade: { trade: undefined } }) => unknown) => selector({ trade: { trade: undefined } }),
    )
  })

  it('opens the editor modal when dispatch returns editor', () => {
    mockUseGasChipDispatch.mockReturnValue({ dispatch: () => ({ type: 'editor' }) })

    const { result } = renderHook(() =>
      useFormGasOverridesController({ tx: undefined, chainId: UniverseChainId.Mainnet }),
    )

    act(() => result.current.onPress())

    expect(result.current.isEditorOpen).toBe(true)
    expect(result.current.isAutoTooltipOpen).toBe(false)
    expect(result.current.isCrosschainOpen).toBe(false)
    expect(updateSwapForm).toHaveBeenCalledWith({ focusOnCurrencyField: undefined })
  })

  it('opens the auto-tooltip modal when dispatch returns auto-tooltip', () => {
    mockUseGasChipDispatch.mockReturnValue({ dispatch: () => ({ type: 'auto-tooltip' }) })

    const { result } = renderHook(() =>
      useFormGasOverridesController({ tx: undefined, chainId: UniverseChainId.Mainnet }),
    )

    act(() => result.current.onPress())

    expect(result.current.isAutoTooltipOpen).toBe(true)
  })

  it('opens the crosschain modal when dispatch returns crosschain-not-supported', () => {
    mockUseGasChipDispatch.mockReturnValue({ dispatch: () => ({ type: 'crosschain-not-supported' }) })

    const { result } = renderHook(() =>
      useFormGasOverridesController({ tx: undefined, chainId: UniverseChainId.Mainnet }),
    )

    act(() => result.current.onPress())

    expect(result.current.isCrosschainOpen).toBe(true)
  })

  it('clears saved overrides and closes editor on reset', () => {
    mockUseGasChipDispatch.mockReturnValue({ dispatch: () => ({ type: 'editor' }) })

    const { result } = renderHook(() =>
      useFormGasOverridesController({ tx: undefined, chainId: UniverseChainId.Mainnet }),
    )

    act(() => result.current.onPress())
    act(() => result.current.onResetOverrides())

    expect(setGasOverrides).toHaveBeenCalledWith(undefined)
    expect(result.current.isEditorOpen).toBe(false)
    expect(updateSwapForm).toHaveBeenLastCalledWith({ focusOnCurrencyField: 'input' })
  })

  it('restores the previously focused field when editor closes', () => {
    focusOnCurrencyField = 'output'
    mockUseGasChipDispatch.mockReturnValue({ dispatch: () => ({ type: 'editor' }) })

    const { result } = renderHook(() =>
      useFormGasOverridesController({ tx: undefined, chainId: UniverseChainId.Mainnet }),
    )

    act(() => result.current.onPress())
    act(() => result.current.onCloseModal())

    expect(result.current.isEditorOpen).toBe(false)
    expect(updateSwapForm).toHaveBeenLastCalledWith({ focusOnCurrencyField: 'output' })
  })

  it('leaves the amount fields unfocused when the editor was opened with no field focused', () => {
    focusOnCurrencyField = undefined
    mockUseGasChipDispatch.mockReturnValue({ dispatch: () => ({ type: 'editor' }) })

    const { result } = renderHook(() =>
      useFormGasOverridesController({ tx: undefined, chainId: UniverseChainId.Mainnet }),
    )

    act(() => result.current.onPress())
    act(() => result.current.onCloseModal())

    // Re-focusing here would pop the keyboard back open on native for a user
    // who had dismissed it before opening the editor.
    expect(updateSwapForm).toHaveBeenLastCalledWith({ focusOnCurrencyField: undefined })
  })
})
