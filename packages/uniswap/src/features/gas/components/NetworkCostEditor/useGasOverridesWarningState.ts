import { type TransactionRequest } from '@ethersproject/providers'
import { useState } from 'react'
import { useGasFieldValidation } from 'uniswap/src/features/gas/components/NetworkCostEditor/useGasFieldValidation'
import { useRecommendedGasFields } from 'uniswap/src/features/gas/components/NetworkCostEditor/useRecommendedGasFields'
import { useEnableCustomGasFeeEntry } from 'uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry'
import type { GasFeeOverrides } from 'uniswap/src/features/gas/types'
import { hasGasOverrides } from 'uniswap/src/features/gas/utils'

export interface GasOverridesWarningState {
  /** Wallet-level opt-in for the Network cost editor. */
  enableCustomGasFeeEntry: boolean
  /** True when saved per-tx overrides exist. */
  hasOverrides: boolean
  /**
   * True only when overrides exist AND running them through validation against
   * the current recommended values produces a non-error warning (e.g. priority
   * fee set far below the recommended target).
   */
  hasWarning: boolean
}

/**
 * Derives the warning state shared between the Network cost row/chip and the
 * submit button on any surface that supports gas overrides (swap form, swap
 * review, dapp tx request). Lifting it here means each consumer can subscribe
 * to the same derivation without duplicating the validation call.
 *
 * Callers pass `gasOverrides` from whatever storage they own and `tx` (the
 * populated swap/approval/dapp request) so the gas-service can return a
 * recommended baseline that's *independent* of any urgency overrides on the
 * tx itself. See `useRecommendedGasFields` for the underlying contract.
 *
 * Callers should typically guard with `FeatureFlags.GasFeeOverrides`; the
 * underlying `useRecommendedGasFields` may issue a gas estimate request that
 * we don't want to fire when the urgency UI is dark.
 */
export function useGasOverridesWarningState({
  tx,
  gasOverrides,
}: {
  tx?: TransactionRequest
  gasOverrides: GasFeeOverrides | undefined
}): GasOverridesWarningState {
  const enableCustomGasFeeEntry = useEnableCustomGasFeeEntry()
  // Skip the underlying gas-fee derivation when no overrides are saved —
  // there's nothing to validate, so the recommended values don't matter.
  const recommended = useRecommendedGasFields({ tx: gasOverrides ? tx : undefined })

  const validation = useGasFieldValidation({
    values: {
      maxBaseFeeGwei: gasOverrides?.maxBaseFeeGwei,
      priorityFeeGwei: gasOverrides?.priorityFeeGwei,
      gasLimit: gasOverrides?.gasLimit,
    },
    recommended,
  })

  const hasOverrides = hasGasOverrides(gasOverrides)

  // Sticky-cache the warning bit across in-flight gas-service requests. Every
  // /swap poll produces a new populated tx (different deadline, sometimes
  // different gas), which changes the gas-service queryKey and evicts the
  // cached recommended values while the next request is in flight; during
  // that window `validation.priorityFee.warning` collapses to undefined and
  // every consumer of this hook would otherwise flash the warning UI off on
  // every poll. We intentionally cache *only* the boolean — caching the
  // recommended values themselves would leak stale baselines into
  // `useTradingApiGasOverrides`, which composes the wire payload's
  // `maxFeePerGas` from them when only one half of the EIP-1559 pair is
  // user-overridden.
  const hasRecommendedBaseline = recommended.recommendedPriorityFeeGwei !== undefined
  const hasFreshWarning = hasOverrides && Boolean(validation.priorityFee.warning)
  const [cachedWarning, setCachedWarning] = useState(false)
  if (hasRecommendedBaseline && cachedWarning !== hasFreshWarning) {
    setCachedWarning(hasFreshWarning)
  }
  const hasWarning = hasOverrides && (hasRecommendedBaseline ? hasFreshWarning : cachedWarning)

  return { enableCustomGasFeeEntry, hasOverrides, hasWarning }
}
