import { type TransactionRequest } from '@ethersproject/providers'
import type { GasFeeResult } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useGasOverridesWarningState } from 'uniswap/src/features/gas/components/NetworkCostEditor/useGasOverridesWarningState'
import { NetworkCostRow } from 'uniswap/src/features/gas/components/NetworkCostRow'
import { useGasFeeFormattedDisplayAmounts } from 'uniswap/src/features/gas/hooks'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useFormGasOverridesController } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/useFormGasOverridesController'

/**
 * Tappable "Network cost" row rendered inside the swap form's expanded
 * transaction-details panel when `FeatureFlags.GasFeeOverrides` is on.
 *
 * Drops into the `NetworkCostRowSlot` prop on `<TransactionDetails>` in place
 * of the inline `<NetworkFee />`. Delegates state + modal rendering to
 * `useFormGasOverridesController` so the native gas-chip variant
 * (`<GasInfoRowWithCustomGasEnabled>`) can share the same dispatch.
 */
export function FormNetworkCostRow({
  gasFee,
  tx,
  chainId,
  includesDelegation,
}: {
  gasFee: GasFeeResult
  tx: TransactionRequest | undefined
  chainId: UniverseChainId
  includesDelegation?: boolean
}): JSX.Element {
  const gasOverrides = useTransactionSettingsStore((s) => s.gasOverrides)
  const { enableCustomGasFeeEntry, hasOverrides, hasWarning } = useGasOverridesWarningState({ tx, gasOverrides })
  const { gasFeeFormatted } = useGasFeeFormattedDisplayAmounts({
    gasFee,
    chainId,
    placeholder: '-',
    includesDelegation,
  })
  const { onPress, modals } = useFormGasOverridesController({ tx, chainId, includesDelegation })

  return (
    <>
      <NetworkCostRow
        gasFeeUsd={gasFeeFormatted}
        enableCustomGasFeeEntry={enableCustomGasFeeEntry}
        hasOverrides={hasOverrides}
        hasWarning={hasWarning}
        onPress={onPress}
      />
      {modals}
    </>
  )
}
