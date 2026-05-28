import { type TransactionRequest } from '@ethersproject/providers'
import type { TradingApi } from '@universe/api'
import { useMemo } from 'react'
import { addGwei, gweiToWei } from 'uniswap/src/features/gas/components/NetworkCostEditor/gweiToWei'
import { useRecommendedGasFields } from 'uniswap/src/features/gas/components/NetworkCostEditor/useRecommendedGasFields'
import { useIsCustomGasFlowAvailable } from 'uniswap/src/features/gas/hooks/useIsCustomGasFlowAvailable'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'

/**
 * Reads the partial per-tx `gasOverrides` from the swap settings store and
 * composes the TAPI `urgency.overrides` wire shape. Each output field is set
 * only when the corresponding user override (or, for `maxFeePerGas`, at least
 * one of its two halves) is present.
 *
 * Returns `undefined` when `useIsCustomGasFlowAvailable()` is false (e.g. web
 * with a non-Embedded Wallet), even if `gasOverrides` is populated. The
 * setting persists across wallet switches, so this gate prevents overrides
 * saved during a prior EW session from leaking into a non-EW transaction.
 *
 * When only one of `maxBaseFeeGwei` / `priorityFeeGwei` is overridden, the
 * recommended baseline (URGENT level, current tx) supplies the other half so
 * `maxFeePerGas = base + priority` remains a valid value on the wire.
 *
 * Values in the store are kept in human units (GWEI / count); this hook is
 * the boundary where we convert to wei.
 */
export function useTradingApiGasOverrides(args: {
  tx: TransactionRequest | undefined
}): TradingApi.UrgencyOverrides | undefined {
  const gasOverrides = useTransactionSettingsStore((s) => s.gasOverrides)
  const isCustomGasFlowAvailable = useIsCustomGasFlowAvailable()
  const recommended = useRecommendedGasFields({
    tx: gasOverrides && isCustomGasFlowAvailable ? args.tx : undefined,
  })

  return useMemo(() => {
    if (!gasOverrides || !isCustomGasFlowAvailable) {
      return undefined
    }
    const hasMaxBase = gasOverrides.maxBaseFeeGwei !== undefined
    const hasPriority = gasOverrides.priorityFeeGwei !== undefined
    const hasGasLimit = gasOverrides.gasLimit !== undefined

    if (!hasMaxBase && !hasPriority && !hasGasLimit) {
      return undefined
    }

    const out: TradingApi.UrgencyOverrides = {}

    if (hasMaxBase || hasPriority) {
      const effectiveMaxBase = gasOverrides.maxBaseFeeGwei ?? recommended.recommendedMaxBaseFeeGwei
      const effectivePriority = gasOverrides.priorityFeeGwei ?? recommended.recommendedPriorityFeeGwei
      if (effectiveMaxBase !== undefined && effectivePriority !== undefined) {
        const maxFee = gweiToWei(addGwei(effectiveMaxBase, effectivePriority))
        if (maxFee !== undefined) {
          out.maxFeePerGas = maxFee
        }
      }
    }
    if (gasOverrides.priorityFeeGwei !== undefined) {
      const priority = gweiToWei(gasOverrides.priorityFeeGwei)
      if (priority !== undefined) {
        out.maxPriorityFeePerGas = priority
      }
    }
    if (hasGasLimit) {
      out.gasLimit = gasOverrides.gasLimit
    }
    return Object.keys(out).length > 0 ? out : undefined
  }, [gasOverrides, isCustomGasFlowAvailable, recommended])
}
