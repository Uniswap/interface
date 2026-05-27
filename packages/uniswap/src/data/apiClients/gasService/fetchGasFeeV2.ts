import { type PartialMessage } from '@bufbuild/protobuf'
import { type TransactionRequest } from '@ethersproject/providers'
import type { Urgency } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import { type GasFeeResultWithoutState, type GasStrategy } from '@universe/api'
import { GasServiceClient } from 'uniswap/src/data/apiClients/gasService/GasServiceClient'
import { mapGasServiceV2Response } from 'uniswap/src/data/apiClients/gasService/mapGasServiceV2Response'
import { mapToEstimateGasFeeRequest } from 'uniswap/src/data/apiClients/gasService/mapToEstimateGasFeeRequest'
import { estimateGasWithClientSideProvider } from 'uniswap/src/features/gas/utils'
import { logger } from 'utilities/src/logger/logger'

export async function fetchGasFeeV2({
  tx,
  gasStrategy,
  smartContractDelegationAddress,
  fallbackGasLimit,
  urgency,
  gasLimitOverride,
  shouldUseUrgency = false,
}: {
  tx: TransactionRequest
  gasStrategy: GasStrategy
  smartContractDelegationAddress?: string
  fallbackGasLimit?: number
  urgency?: PartialMessage<Urgency>
  gasLimitOverride?: string
  shouldUseUrgency?: boolean
}): Promise<GasFeeResultWithoutState> {
  try {
    const request = mapToEstimateGasFeeRequest({
      tx,
      gasStrategy,
      smartContractDelegationAddress,
      urgency,
      gasLimitOverride,
      shouldUseUrgency,
    })
    const response = await GasServiceClient.estimateGasFee(request)
    return mapGasServiceV2Response({ response, gasStrategy })
  } catch (error) {
    const loggedError = new Error('Gas service v2 estimation failed', {
      cause: error,
    })

    logger.error(loggedError, {
      tags: {
        file: 'fetchGasFeeV2',
        function: 'fetchGasFeeV2',
      },
      extra: {
        tx,
        gasStrategy,
        smartContractDelegationAddress,
        urgency,
        gasLimitOverride,
        shouldUseUrgency,
      },
    })

    return estimateGasWithClientSideProvider({ tx, fallbackGasLimit })
  }
}
