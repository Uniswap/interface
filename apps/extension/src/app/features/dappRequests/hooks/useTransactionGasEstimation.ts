import { TransactionRequest } from '@ethersproject/providers'
import { useEffect, useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { logger } from 'utilities/src/logger/logger'

interface UseTransactionGasEstimationParams {
  /** Base transaction data (will be formatted with chainId) */
  baseTx?: TransactionRequest
  /** Chain ID to add to transaction */
  chainId?: UniverseChainId
  /** Whether to skip gas estimation */
  skip?: boolean
  /** Smart contract delegation address (for SendCalls) */
  smartContractDelegationAddress?: string
}

interface UseTransactionGasEstimationResult {
  /** The gas fee result from estimation */
  gasFeeResult: GasFeeResult
  /** Whether the gas fee result is invalid */
  isInvalidGasFeeResult: boolean
}

/**
 * Shared hook for transaction gas estimation with error handling and validation
 */
export function useTransactionGasEstimation({
  baseTx,
  chainId,
  skip = false,
  smartContractDelegationAddress,
}: UseTransactionGasEstimationParams): UseTransactionGasEstimationResult {
  const formattedTx = useMemo(() => {
    return baseTx && chainId ? { ...baseTx, chainId } : undefined
  }, [baseTx, chainId])

  const gasFeeResult = useTransactionGasFee({
    tx: formattedTx,
    skip: skip || !formattedTx,
    refetchInterval: PollingInterval.LightningMcQueen,
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

  return {
    gasFeeResult,
    isInvalidGasFeeResult,
  }
}

/**
 * Helper function to validate gas fee results
 */
function isInvalidGasFeeResultHelper(gasFeeResult: GasFeeResult): boolean {
  return !!gasFeeResult.error || (!gasFeeResult.isLoading && (!gasFeeResult.params || !gasFeeResult.value))
}
