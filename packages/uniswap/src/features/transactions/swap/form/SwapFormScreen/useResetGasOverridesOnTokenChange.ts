import { useEffect } from 'react'
import { useTransactionSettingsActions } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { usePrevious } from 'utilities/src/react/hooks'

/**
 * Clears saved per-tx gas overrides whenever the input or output token changes.
 * Overrides (max base fee, priority fee, gas limit) are tuned to one specific
 * trade, so they stop being meaningful once either side changes — and this
 * keeps stale overrides from leaking into a different trade (e.g. an
 * output-chain switch that turns the swap into a bridge whose editor is
 * disabled). Mounted from `SwapFormScreen` so it only runs while the form is active.
 */
export function useResetGasOverridesOnTokenChange(): void {
  const inputCurrencyId = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.INPUT]?.currencyId)
  const outputCurrencyId = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.OUTPUT]?.currencyId)
  const { clearGasOverrides } = useTransactionSettingsActions()

  const prevInputCurrencyId = usePrevious(inputCurrencyId)
  const prevOutputCurrencyId = usePrevious(outputCurrencyId)

  useEffect(() => {
    // Skip the initial mount (no previous value yet) and the empty→selected
    // transition; only react once a real token swaps out for another.
    const inputChanged = prevInputCurrencyId !== undefined && prevInputCurrencyId !== inputCurrencyId
    const outputChanged = prevOutputCurrencyId !== undefined && prevOutputCurrencyId !== outputCurrencyId
    if (inputChanged || outputChanged) {
      clearGasOverrides()
    }
  }, [inputCurrencyId, outputCurrencyId, prevInputCurrencyId, prevOutputCurrencyId, clearGasOverrides])
}
