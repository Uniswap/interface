import { renderHook } from '@testing-library/react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTransactionSettingsActions } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useResetGasOverridesOnInputChainChange } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/useResetGasOverridesOnInputChainChange'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { vi } from 'vitest'

vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
)
vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore')

const mockUseTransactionSettingsActions = vi.mocked(useTransactionSettingsActions)
const mockUseSwapFormStoreDerivedSwapInfo = useSwapFormStoreDerivedSwapInfo as unknown as ReturnType<typeof vi.fn>

type Currencies = {
  [CurrencyField.INPUT]?: { currency: { chainId: number } }
  [CurrencyField.OUTPUT]?: { currency: { chainId: number } }
}

function setCurrencies(currencies: Currencies): void {
  mockUseSwapFormStoreDerivedSwapInfo.mockImplementation((selector: (s: { currencies: Currencies }) => unknown) =>
    selector({ currencies }),
  )
}

describe('useResetGasOverridesOnInputChainChange', () => {
  const clearGasOverrides = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTransactionSettingsActions.mockReturnValue({ clearGasOverrides } as never)
  })

  it('does NOT call clearGasOverrides on first mount', () => {
    setCurrencies({
      [CurrencyField.INPUT]: { currency: { chainId: UniverseChainId.Mainnet } },
      [CurrencyField.OUTPUT]: { currency: { chainId: UniverseChainId.Mainnet } },
    })
    renderHook(() => useResetGasOverridesOnInputChainChange())
    expect(clearGasOverrides).not.toHaveBeenCalled()
  })

  it('calls clearGasOverrides when input chain changes', () => {
    setCurrencies({
      [CurrencyField.INPUT]: { currency: { chainId: UniverseChainId.Mainnet } },
      [CurrencyField.OUTPUT]: { currency: { chainId: UniverseChainId.Mainnet } },
    })
    const { rerender } = renderHook(() => useResetGasOverridesOnInputChainChange())

    setCurrencies({
      [CurrencyField.INPUT]: { currency: { chainId: UniverseChainId.ArbitrumOne } },
      [CurrencyField.OUTPUT]: { currency: { chainId: UniverseChainId.Mainnet } },
    })
    rerender()
    expect(clearGasOverrides).toHaveBeenCalledTimes(1)
  })

  it('does NOT call clearGasOverrides when only the output chain changes', () => {
    setCurrencies({
      [CurrencyField.INPUT]: { currency: { chainId: UniverseChainId.Mainnet } },
      [CurrencyField.OUTPUT]: { currency: { chainId: UniverseChainId.Mainnet } },
    })
    const { rerender } = renderHook(() => useResetGasOverridesOnInputChainChange())

    setCurrencies({
      [CurrencyField.INPUT]: { currency: { chainId: UniverseChainId.Mainnet } },
      [CurrencyField.OUTPUT]: { currency: { chainId: UniverseChainId.ArbitrumOne } },
    })
    rerender()
    expect(clearGasOverrides).not.toHaveBeenCalled()
  })

  it('fires once per input change across multiple rerenders', () => {
    setCurrencies({
      [CurrencyField.INPUT]: { currency: { chainId: UniverseChainId.Mainnet } },
      [CurrencyField.OUTPUT]: { currency: { chainId: UniverseChainId.Mainnet } },
    })
    const { rerender } = renderHook(() => useResetGasOverridesOnInputChainChange())

    setCurrencies({
      [CurrencyField.INPUT]: { currency: { chainId: UniverseChainId.ArbitrumOne } },
      [CurrencyField.OUTPUT]: { currency: { chainId: UniverseChainId.Mainnet } },
    })
    rerender()
    rerender()
    rerender()
    expect(clearGasOverrides).toHaveBeenCalledTimes(1)

    setCurrencies({
      [CurrencyField.INPUT]: { currency: { chainId: UniverseChainId.Optimism } },
      [CurrencyField.OUTPUT]: { currency: { chainId: UniverseChainId.Mainnet } },
    })
    rerender()
    expect(clearGasOverrides).toHaveBeenCalledTimes(2)
  })
})
