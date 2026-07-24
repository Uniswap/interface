import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { getCreateTierFeeBreakdown } from 'uniswap/src/features/fees/feeCurve'
import { feeAmountToBps } from 'uniswap/src/features/fees/feeUnits'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import type { FeeBreakdown } from 'uniswap/src/features/fees/types'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { DEFAULT_FEE_DATA } from '~/features/Liquidity/Create/types'
import { isDynamicFeeTier } from '~/features/Liquidity/utils/feeTiers'

/**
 * Fee breakdown for the tier a create/migrate flow has settled on, shared by every surface that shows
 * it (the selector header, the review modal, the edit summary). `servedProtocolFee` is the protocol
 * fee (integer pips) served for the selected tier's pool — from the create context, which fetches it
 * once via GetProtocolFees. Served → split from it. Otherwise (a not-yet-created pool) it's computed:
 * a vanilla v4 tier from the governance curve, a v2/v3 tier from the subtractive fee-switch schedule;
 * a hooked v4 pool → `unavailable`. Dynamic tiers have no fixed rate → no breakdown. Flag-gated
 * (returns `undefined` when off).
 */
export function useSelectedFeeBreakdown({
  protocolVersion,
  fee,
  servedProtocolFee,
  hook,
}: {
  protocolVersion: ProtocolVersion
  fee: FeeData | undefined
  servedProtocolFee: number | undefined
  hook: string | undefined
}): FeeBreakdown | undefined {
  const isFeeDisplayEnabled = useFeatureFlag(FeatureFlags.V4ProtocolFeeDisplay)

  return useMemo(() => {
    if (!isFeeDisplayEnabled) {
      return undefined
    }
    const isV2 = protocolVersion === ProtocolVersion.V2
    // v2 carries no explicit fee tier; fall back to the fixed 0.30% tier so the breakdown still renders.
    const selected = isV2 ? DEFAULT_FEE_DATA : fee
    if (!selected || isDynamicFeeTier(selected)) {
      return undefined
    }
    // Existing pool: split from the served value. Not-yet-created: derive from math — v4 from the
    // governance curve (hooked → unavailable), v2/v3 from the subtractive fee-switch schedule, both
    // handled inside getCreateTierFeeBreakdown.
    if (servedProtocolFee !== undefined) {
      return getFeeBreakdown({
        feeAmount: selected.feeAmount,
        protocolVersion,
        servedProtocolFeeBps: feeAmountToBps(servedProtocolFee),
      })
    }
    return getCreateTierFeeBreakdown({ feeAmount: selected.feeAmount, protocolVersion, hook })
  }, [isFeeDisplayEnabled, protocolVersion, fee, servedProtocolFee, hook])
}
