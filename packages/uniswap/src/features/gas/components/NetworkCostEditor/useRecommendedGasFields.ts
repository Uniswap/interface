import { type TransactionRequest } from '@ethersproject/providers'
import { Level } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import { useMemo } from 'react'
import { useGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { weiToGwei } from 'uniswap/src/features/gas/components/NetworkCostEditor/gweiToWei'

/** Pinned to URGENT — matches `DEFAULT_URGENCY_LEVEL` (TAPI swap path). */
const RECOMMENDED_URGENCY = { level: Level.URGENT }

export interface RecommendedGasFields {
  recommendedMaxBaseFeeGwei: string | undefined
  recommendedPriorityFeeGwei: string | undefined
  recommendedGasLimit: string | undefined
  /** Current network base fee in GWEI, used to validate the user's max base fee override. */
  currentNetworkBaseFeeGwei: string | undefined
  isLoading: boolean
}

/** The four value fields, without `isLoading` — used as the quote-derived fallback. */
export type RecommendedGasFieldValues = Omit<RecommendedGasFields, 'isLoading'>

const EMPTY_RECOMMENDED_VALUES: RecommendedGasFieldValues = {
  recommendedMaxBaseFeeGwei: undefined,
  recommendedPriorityFeeGwei: undefined,
  recommendedGasLimit: undefined,
  currentNetworkBaseFeeGwei: undefined,
}

/**
 * Derives the recommended baseline from a quote's gas data, for when no
 * populated swap tx is available to estimate against (e.g. a Permit2-signature
 * swap, whose `/swap` is deferred until the user signs). `gasEstimate` supplies
 * the EIP-1559 fee params; the gas limit comes from `gasUseEstimate ×
 * limitInflationFactor` (matching the populated tx) rather than
 * `gasEstimate.gasLimit`, which is unreliable on some chains. Returns
 * all-undefined when the fee params are missing.
 */
export function getRecommendedGasFieldsFromQuoteGas(args: {
  gasUseEstimate?: string
  gasEstimate?: {
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
    gasLimit?: string
    strategy?: { limitInflationFactor?: number }
  }
}): RecommendedGasFieldValues {
  const { gasUseEstimate, gasEstimate } = args
  if (!gasEstimate?.maxFeePerGas || !gasEstimate.maxPriorityFeePerGas) {
    return EMPTY_RECOMMENDED_VALUES
  }
  let maxFee: bigint
  let prio: bigint
  try {
    maxFee = BigInt(gasEstimate.maxFeePerGas)
    prio = BigInt(gasEstimate.maxPriorityFeePerGas)
  } catch {
    return EMPTY_RECOMMENDED_VALUES
  }
  const baseFee = maxFee > prio ? maxFee - prio : BigInt(0)
  const baseFeeGwei = weiToGwei(baseFee)

  const inflation = gasEstimate.strategy?.limitInflationFactor ?? 1
  const inflatedGasLimit =
    gasUseEstimate && Number.isFinite(Number(gasUseEstimate))
      ? Math.round(Number(gasUseEstimate) * inflation).toString()
      : gasEstimate.gasLimit

  return {
    recommendedMaxBaseFeeGwei: baseFeeGwei,
    recommendedPriorityFeeGwei: weiToGwei(prio),
    recommendedGasLimit: inflatedGasLimit,
    currentNetworkBaseFeeGwei: baseFeeGwei,
  }
}

/**
 * Returns the gas-service recommended baseline for the three user-facing gas
 * fields. Used by the Network cost editor for the inline "Recommended: X" hint
 * and the in-editor validation warnings — both need a baseline that's
 * *independent* of any urgency overrides the user has applied (the swap
 * response's tx already has those baked in).
 */
export function useRecommendedGasFields({
  tx,
  fallback,
}: {
  tx?: TransactionRequest
  /**
   * Quote-derived baseline used when no populated `tx` is available to estimate
   * against (the gas service needs a `tx`). Built via
   * `getRecommendedGasFieldsFromQuoteGas`.
   */
  fallback?: RecommendedGasFieldValues
}): RecommendedGasFields {
  const { data, isLoading } = useGasFeeQuery({
    params: tx ? { tx, urgency: RECOMMENDED_URGENCY } : undefined,
  })

  return useMemo(() => {
    const params = data?.params
    // Require all three EIP-1559 fields; a partial response from the gas service
    // would otherwise throw `Cannot convert undefined to a BigInt` below.
    if (
      !params ||
      !('maxFeePerGas' in params) ||
      !params.maxFeePerGas ||
      !params.maxPriorityFeePerGas ||
      !params.gasLimit
    ) {
      // No tx-based estimate (e.g. `/swap` deferred pending a permit signature)
      // — fall back to the quote's gas data so the editor still shows a baseline.
      return { ...(fallback ?? EMPTY_RECOMMENDED_VALUES), isLoading }
    }
    const maxFee = BigInt(params.maxFeePerGas)
    const prio = BigInt(params.maxPriorityFeePerGas)
    // Floor at 0 — a misbehaving service returning prio > maxFee would otherwise
    // produce a malformed GWEI string from sign-preserving BigInt modulo.
    const baseFee = maxFee > prio ? maxFee - prio : BigInt(0)
    const baseFeeGwei = weiToGwei(baseFee)
    return {
      recommendedMaxBaseFeeGwei: baseFeeGwei,
      recommendedPriorityFeeGwei: weiToGwei(prio),
      recommendedGasLimit: params.gasLimit.toString(),
      currentNetworkBaseFeeGwei: baseFeeGwei,
      isLoading,
    }
  }, [data, isLoading, fallback])
}
