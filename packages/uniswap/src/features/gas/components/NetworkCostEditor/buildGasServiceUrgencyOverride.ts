import { type PartialMessage } from '@bufbuild/protobuf'
import { Level, type Urgency } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import { addGwei, gweiToWei } from 'uniswap/src/features/gas/components/NetworkCostEditor/gweiToWei'
import type { GasFeeOverrides } from 'uniswap/src/features/gas/types'

/**
 * Translates the store-shape per-tx `GasFeeOverrides` (human GWEI / count) into
 * the gas-service proto wire shape: a `PartialMessage<Urgency>` for the
 * `urgencies` array and a separate top-level `gasLimitOverride`.
 *
 * Supports partial overrides — when only one of `maxBaseFeeGwei` /
 * `priorityFeeGwei` is set, the `recommended` baseline supplies the other half
 * so `maxFeePerGas = base + priority` remains a valid value on the wire. When
 * `recommended` is unavailable and only one half is set, `maxFeePerGas` is
 * omitted (degrades gracefully — the gas service falls back to its own estimate).
 *
 * Returns `{ undefined, undefined }` when no overrides are set so callers can
 * pass through to `useTransactionGasFee` without conditionals.
 *
 * Dapp / WalletConnect analogue of `useTradingApiGasOverrides` (which targets
 * the TAPI shape used by the swap flow). The two helpers exist because the
 * gas service and the trading API encode `gas_limit` differently — the gas
 * service has it at the top level, TAPI nests it inside `urgency.overrides`.
 */
export function buildGasServiceUrgencyOverride({
  gasOverrides,
  recommended,
  level = Level.URGENT,
}: {
  gasOverrides: GasFeeOverrides | undefined
  recommended?: {
    recommendedMaxBaseFeeGwei: string | undefined
    recommendedPriorityFeeGwei: string | undefined
  }
  level?: Level
}): {
  urgency: PartialMessage<Urgency> | undefined
  gasLimitOverride: string | undefined
} {
  if (!gasOverrides) {
    return { urgency: undefined, gasLimitOverride: undefined }
  }

  const hasMaxBase = gasOverrides.maxBaseFeeGwei !== undefined
  const hasPriority = gasOverrides.priorityFeeGwei !== undefined
  const hasGasLimit = gasOverrides.gasLimit !== undefined

  let urgency: PartialMessage<Urgency> | undefined

  if (hasMaxBase || hasPriority) {
    const effectiveMaxBase = gasOverrides.maxBaseFeeGwei ?? recommended?.recommendedMaxBaseFeeGwei
    const effectivePriority = gasOverrides.priorityFeeGwei ?? recommended?.recommendedPriorityFeeGwei

    const overrides: { maxFeePerGas?: string; maxPriorityFeePerGas?: string } = {}

    if (effectiveMaxBase !== undefined && effectivePriority !== undefined) {
      const maxFee = gweiToWei(addGwei(effectiveMaxBase, effectivePriority))
      if (maxFee !== undefined) {
        overrides.maxFeePerGas = maxFee
      }
    }
    if (gasOverrides.priorityFeeGwei !== undefined) {
      const priority = gweiToWei(gasOverrides.priorityFeeGwei)
      if (priority !== undefined) {
        overrides.maxPriorityFeePerGas = priority
      }
    }

    if (Object.keys(overrides).length > 0) {
      urgency = { level, overrides }
    }
  }

  return {
    urgency,
    gasLimitOverride: hasGasLimit ? gasOverrides.gasLimit : undefined,
  }
}
