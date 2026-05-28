import { type PartialMessage } from '@bufbuild/protobuf'
import { TransactionRequest } from '@ethersproject/providers'
import type { Urgency } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import { GasFeeResult } from '@universe/api'
import { useEffect, useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { logger } from 'utilities/src/logger/logger'

interface UseTransactionGasEstimationParams {
  baseTx?: TransactionRequest
  chainId?: UniverseChainId
  skip?: boolean
  smartContractDelegationAddress?: string
  /** Proto-shape urgency built from the per-request override state. */
  urgency?: PartialMessage<Urgency>
  /** Top-level gas_limit override built from the per-request override state. */
  gasLimitOverride?: string
}

interface UseTransactionGasEstimationResult {
  gasFeeResult: GasFeeResult
  isInvalidGasFeeResult: boolean
}

export function useTransactionGasEstimation({
  baseTx,
  chainId,
  skip = false,
  smartContractDelegationAddress,
  urgency,
  gasLimitOverride,
}: UseTransactionGasEstimationParams): UseTransactionGasEstimationResult {
  const formattedTx = useMemo(() => {
    return baseTx && chainId ? { ...baseTx, chainId } : undefined
  }, [baseTx, chainId])

  const gasFeeResult = useTransactionGasFee({
    tx: formattedTx,
    skip: skip || !formattedTx,
    refetchInterval: PollingInterval.LightningMcQueen,
    urgency,
    gasLimitOverride,
    ...(smartContractDelegationAddress && { smartContractDelegationAddress }),
  })

  const isInvalidGasFeeResult = isInvalidGasFeeResultHelper(gasFeeResult)

  useEffect(() => {
    if (formattedTx && isInvalidGasFeeResult) {
      const error = gasFeeResult.error ?? new Error('Invalid gas fee result for dapp request.')
      logger.error(error, {
        tags: { file: 'useTransactionGasEstimation', function: 'useEffect' },
        extra: { request: formattedTx },
      })
    }
  }, [formattedTx, isInvalidGasFeeResult, gasFeeResult])

  return { gasFeeResult, isInvalidGasFeeResult }
}

function isInvalidGasFeeResultHelper(gasFeeResult: GasFeeResult): boolean {
  return !!gasFeeResult.error || (!gasFeeResult.isLoading && (!gasFeeResult.params || !gasFeeResult.value))
}
