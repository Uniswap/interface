import { type TransactionRequest } from '@ethersproject/providers'
import { useGasOverridesWarningState } from 'uniswap/src/features/gas/components/NetworkCostEditor/useGasOverridesWarningState'
import { NetworkCostRow } from 'uniswap/src/features/gas/components/NetworkCostRow'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'

export interface ReviewNetworkCostRowProps {
  gasFeeUsd: string | undefined
  tx: TransactionRequest | undefined
  includesDelegation?: boolean
  includesDelegationUpgrade?: boolean
}

/**
 * Display-only Network cost row used on the swap review screen when
 * `FeatureFlags.GasFeeOverrides` is on. Customization happens on the swap
 * form's gas chip; the review screen only summarizes the resulting state
 * (Auto / Custom / amber warning), with no tap behavior.
 *
 * The Swap button on the review screen consumes the same
 * `useGasOverridesWarningState` hook to stay in sync with this row's warning
 * presentation.
 */
export function ReviewNetworkCostRow({
  gasFeeUsd,
  tx,
  includesDelegation,
  includesDelegationUpgrade,
}: ReviewNetworkCostRowProps): JSX.Element {
  const gasOverrides = useTransactionSettingsStore((s) => s.gasOverrides)
  const { enableCustomGasFeeEntry, hasOverrides, hasWarning } = useGasOverridesWarningState({ tx, gasOverrides })

  return (
    <NetworkCostRow
      gasFeeUsd={gasFeeUsd}
      enableCustomGasFeeEntry={enableCustomGasFeeEntry}
      hasOverrides={hasOverrides}
      hasWarning={hasWarning}
      includesDelegation={includesDelegation}
      includesDelegationUpgrade={includesDelegationUpgrade}
      pressable={false}
    />
  )
}
