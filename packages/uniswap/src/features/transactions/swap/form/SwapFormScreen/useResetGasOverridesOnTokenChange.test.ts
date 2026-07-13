import { renderHook } from '@testing-library/react'
import { useTransactionSettingsActions } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useResetGasOverridesOnTokenChange } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/useResetGasOverridesOnTokenChange'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { vi } from 'vitest'

vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
)
vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore')

const mockUseTransactionSettingsActions = vi.mocked(useTransactionSettingsActions)
const mockUseSwapFormStoreDerivedSwapInfo = useSwapFormStoreDerivedSwapInfo as unknown as ReturnType<typeof vi.fn>

// Token identities (currencyId strings) used by the hook.
const ETH = 'eip155:130/slip44:60'
const UNI = 'eip155:130/erc20:0x8f187aA05619a017077f5308904739877ce9eA21'
const USDC = 'eip155:130/erc20:0x078D782b760474a361dDA0AF3839290b0EF57AD6'
const USDC_ARB = 'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831'

type Currencies = {
  [CurrencyField.INPUT]?: { currencyId: string }
  [CurrencyField.OUTPUT]?: { currencyId: string }
}

function setCurrencies(currencies: Currencies): void {
  mockUseSwapFormStoreDerivedSwapInfo.mockImplementation((selector: (s: { currencies: Currencies }) => unknown) =>
    selector({ currencies }),
  )
}

describe('useResetGasOverridesOnTokenChange', () => {
  const clearGasOverrides = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTransactionSettingsActions.mockReturnValue({ clearGasOverrides } as never)
  })

  it('does NOT clear on first mount', () => {
    setCurrencies({ [CurrencyField.INPUT]: { currencyId: ETH }, [CurrencyField.OUTPUT]: { currencyId: USDC } })
    renderHook(() => useResetGasOverridesOnTokenChange())
    expect(clearGasOverrides).not.toHaveBeenCalled()
  })

  it('clears when the input token changes on the same chain', () => {
    setCurrencies({ [CurrencyField.INPUT]: { currencyId: ETH }, [CurrencyField.OUTPUT]: { currencyId: USDC } })
    const { rerender } = renderHook(() => useResetGasOverridesOnTokenChange())

    setCurrencies({ [CurrencyField.INPUT]: { currencyId: UNI }, [CurrencyField.OUTPUT]: { currencyId: USDC } })
    rerender()
    expect(clearGasOverrides).toHaveBeenCalledTimes(1)
  })

  it('clears when the output token changes on the same chain', () => {
    setCurrencies({ [CurrencyField.INPUT]: { currencyId: ETH }, [CurrencyField.OUTPUT]: { currencyId: USDC } })
    const { rerender } = renderHook(() => useResetGasOverridesOnTokenChange())

    setCurrencies({ [CurrencyField.INPUT]: { currencyId: ETH }, [CurrencyField.OUTPUT]: { currencyId: UNI } })
    rerender()
    expect(clearGasOverrides).toHaveBeenCalledTimes(1)
  })

  it('clears when the output token moves to another chain (becomes a bridge)', () => {
    setCurrencies({ [CurrencyField.INPUT]: { currencyId: ETH }, [CurrencyField.OUTPUT]: { currencyId: USDC } })
    const { rerender } = renderHook(() => useResetGasOverridesOnTokenChange())

    setCurrencies({ [CurrencyField.INPUT]: { currencyId: ETH }, [CurrencyField.OUTPUT]: { currencyId: USDC_ARB } })
    rerender()
    expect(clearGasOverrides).toHaveBeenCalledTimes(1)
  })

  it('does NOT clear when neither token changes (e.g. only the amount changes)', () => {
    setCurrencies({ [CurrencyField.INPUT]: { currencyId: ETH }, [CurrencyField.OUTPUT]: { currencyId: USDC } })
    const { rerender } = renderHook(() => useResetGasOverridesOnTokenChange())

    rerender()
    rerender()
    expect(clearGasOverrides).not.toHaveBeenCalled()
  })

  it('does NOT clear when an empty side is first selected', () => {
    setCurrencies({ [CurrencyField.INPUT]: { currencyId: ETH } })
    const { rerender } = renderHook(() => useResetGasOverridesOnTokenChange())

    setCurrencies({ [CurrencyField.INPUT]: { currencyId: ETH }, [CurrencyField.OUTPUT]: { currencyId: USDC } })
    rerender()
    expect(clearGasOverrides).not.toHaveBeenCalled()
  })

  it('fires once per change across multiple rerenders', () => {
    setCurrencies({ [CurrencyField.INPUT]: { currencyId: ETH }, [CurrencyField.OUTPUT]: { currencyId: USDC } })
    const { rerender } = renderHook(() => useResetGasOverridesOnTokenChange())

    setCurrencies({ [CurrencyField.INPUT]: { currencyId: UNI }, [CurrencyField.OUTPUT]: { currencyId: USDC } })
    rerender()
    rerender()
    rerender()
    expect(clearGasOverrides).toHaveBeenCalledTimes(1)

    setCurrencies({ [CurrencyField.INPUT]: { currencyId: ETH }, [CurrencyField.OUTPUT]: { currencyId: USDC } })
    rerender()
    expect(clearGasOverrides).toHaveBeenCalledTimes(2)
  })
})
