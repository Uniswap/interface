import { type PartialMessage } from '@bufbuild/protobuf'
import { type TransactionRequest } from '@ethersproject/providers'
import type {
  EstimateGasFeeRequest,
  GasStrategy as GasServiceGasStrategy,
  Urgency,
} from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import { type GasStrategy } from '@universe/api'

export function mapToEstimateGasFeeRequest({
  tx,
  gasStrategy,
  smartContractDelegationAddress,
  urgency,
  gasLimitOverride,
  shouldUseUrgency,
}: {
  tx: TransactionRequest
  gasStrategy: GasStrategy
  smartContractDelegationAddress?: string
  urgency?: PartialMessage<Urgency>
  /** Caller-supplied override for the top-level `gas_limit` field. When set,
   *  the gas service uses this exact value instead of running its own
   *  `eth_estimateGas` / `eth_simulateV1`. Only meaningful on the urgency
   *  request path — the legacy `gas_strategies` path forwards `tx.gasLimit`
   *  for backwards compatibility regardless of this parameter. */
  gasLimitOverride?: string
  shouldUseUrgency: boolean
}): PartialMessage<EstimateGasFeeRequest> {
  const base: PartialMessage<EstimateGasFeeRequest> = {
    chainId: tx.chainId,
    from: tx.from,
    to: tx.to,
    data: tx.data?.toString(),
    value: tx.value?.toString(),
    ...(smartContractDelegationAddress ? { smartContractDelegationAddress } : {}),
  }

  if (shouldUseUrgency && urgency) {
    // Only forward `gas_limit` when the caller has explicitly overridden it.
    // Absent → the gas service runs its own estimation (eth_estimateGas /
    // eth_simulateV1), which is the recommended default.
    return {
      ...base,
      urgencies: [urgency],
      ...(gasLimitOverride !== undefined ? { gasLimit: gasLimitOverride } : {}),
    }
  }

  // Legacy gas_strategies path: forward tx.gasLimit to preserve the
  // pre-urgency contract (the FE has historically supplied a gas-limit
  // estimate from the TAPI swap response).
  const protoStrategy: PartialMessage<GasServiceGasStrategy> = {
    limitInflationFactor: gasStrategy.limitInflationFactor,
    priceInflationFactor: gasStrategy.priceInflationFactor,
    percentileThresholdFor1559Fee: gasStrategy.percentileThresholdFor1559Fee,
    thresholdToInflateLastBlockBaseFee: gasStrategy.thresholdToInflateLastBlockBaseFee ?? undefined,
    baseFeeMultiplier: gasStrategy.baseFeeMultiplier ?? undefined,
    baseFeeHistoryWindow: gasStrategy.baseFeeHistoryWindow ?? undefined,
    minPriorityFeeRatioOfBaseFee: gasStrategy.minPriorityFeeRatioOfBaseFee ?? undefined,
    minPriorityFeeGwei: gasStrategy.minPriorityFeeGwei ?? undefined,
    maxPriorityFeeGwei: gasStrategy.maxPriorityFeeGwei ?? undefined,
  }

  return { ...base, gasLimit: tx.gasLimit?.toString(), gasStrategies: [protoStrategy] }
}
