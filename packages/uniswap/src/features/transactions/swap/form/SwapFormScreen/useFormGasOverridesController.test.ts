import { act, renderHook } from '@testing-library/react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useGasChipDispatch } from 'uniswap/src/features/gas/hooks/useGasChipDispatch'
import {
  useTransactionSettingsActions,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore'
import { useFormGasOverridesController } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/useFormGasOverridesController'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

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

const mockUseGasChipDispatch = useGasChipDispatch as ReturnType<typeof vi.fn>
const mockUseTransactionSettingsStore = useTransactionSettingsStore as unknown as ReturnType<typeof vi.fn>
const mockUseTransactionSettingsActions = useTransactionSettingsActions as ReturnType<typeof vi.fn>
const mockUseSwapFormScreenStore = useSwapFormScreenStore as unknown as ReturnType<typeof vi.fn>
const mockUseSwapFormStoreDerivedSwapInfo = useSwapFormStoreDerivedSwapInfo as unknown as ReturnType<typeof vi.fn>

describe('useFormGasOverridesController', () => {
  const setGasOverrides = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTransactionSettingsStore.mockImplementation((selector: (s: { gasOverrides: undefined }) => unknown) =>
      selector({ gasOverrides: undefined }),
    )
    mockUseTransactionSettingsActions.mockReturnValue({ setGasOverrides })
    mockUseSwapFormScreenStore.mockImplementation((selector: (s: { isCrossChain: boolean }) => unknown) =>
      selector({ isCrossChain: false }),
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
  })
})
