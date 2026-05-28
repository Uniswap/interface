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

/**
 * Returns the gas-service recommended baseline for the three user-facing gas
 * fields. Used by the Network cost editor for the inline "Recommended: X" hint
 * and the in-editor validation warnings — both need a baseline that's
 * *independent* of any urgency overrides the user has applied (the swap
 * response's tx already has those baked in).
 */
export function useRecommendedGasFields({ tx }: { tx?: TransactionRequest }): RecommendedGasFields {
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
      return {
        recommendedMaxBaseFeeGwei: undefined,
        recommendedPriorityFeeGwei: undefined,
        recommendedGasLimit: undefined,
        currentNetworkBaseFeeGwei: undefined,
        isLoading,
      }
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
  }, [data, isLoading])
}
