import { useTransactionSettingsActions } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useChainIdsChangeEffect } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/hooks/useChainIdsChangeEffect'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Clears any saved per-tx gas overrides when the swap form's input chain
 * changes. Per the Network cost editor Figma annotation: "Gas resets to auto
 * values if user changes input network" (node 5613:94121).
 *
 * Rationale: overrides are tuned to one chain's fee baseline (e.g. Mainnet
 * priority fees ~5 GWEI vs Arbitrum's ~0). Carrying them across chains would
 * either silently fail (gas service revalidates and falls back) or, worse,
 * apply a Mainnet override on an L2 with very different fee dynamics.
 *
 * Output-chain changes do NOT clear overrides — the annotation specifies
 * "input network" and the cost basis is keyed to the input chain only.
 *
 * Mounted from `SwapFormScreen` so it only runs while the form is active —
 * Review/Submit screens can't change chain, so no need to subscribe there.
 */
export function useResetGasOverridesOnInputChainChange(): void {
  const inputChainId = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.INPUT]?.currency.chainId)
  const outputChainId = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.OUTPUT]?.currency.chainId)
  const { clearGasOverrides } = useTransactionSettingsActions()

  const onChainIdsChanged = useEvent(({ hasInputChanged }: { hasInputChanged: boolean }) => {
    if (hasInputChanged) {
      clearGasOverrides()
    }
  })

  useChainIdsChangeEffect({ inputChainId, outputChainId, onChainIdsChanged })
}
