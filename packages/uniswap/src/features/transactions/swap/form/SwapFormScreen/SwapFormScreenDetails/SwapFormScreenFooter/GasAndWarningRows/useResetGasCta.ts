import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { WarningLabel, type Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { useIsCustomGasFlowAvailable } from 'uniswap/src/features/gas/hooks/useIsCustomGasFlowAvailable'
import { hasGasOverrides } from 'uniswap/src/features/gas/utils'
import {
  useTransactionSettingsActions,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Reset control for the swap form footer: clears a saved custom gas override
 * that made the trade unquotable — the state that hides the normal gas entry
 * point. Gated on the same conditions under which the override is sent on the
 * quote, so the reset always has an effect.
 */
export function useResetGasCta(inlineWarning: Warning | undefined): {
  showResetGas: boolean
  onResetGas: () => void
} {
  const isGasFeeOverridesEnabled = useFeatureFlag(FeatureFlags.GasFeeOverrides)
  const isCustomGasFlowAvailable = useIsCustomGasFlowAvailable()
  const gasOverrides = useTransactionSettingsStore((s) => s.gasOverrides)
  const { setGasOverrides } = useTransactionSettingsActions()

  const onResetGas = useEvent((): void => setGasOverrides(undefined))
  const showResetGas =
    isGasFeeOverridesEnabled &&
    isCustomGasFlowAvailable &&
    inlineWarning?.type === WarningLabel.SwapRouterError &&
    hasGasOverrides(gasOverrides)

  return { showResetGas, onResetGas }
}
