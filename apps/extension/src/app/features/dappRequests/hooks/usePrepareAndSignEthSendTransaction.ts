import { useMemo } from 'react'
import { usePrepareAndSignDappTransaction } from 'src/app/features/dappRequests/hooks/usePrepareAndSignDappTransaction'
import { useTransactionGasEstimation } from 'src/app/features/dappRequests/hooks/useTransactionGasEstimation'
import { DappRequestStoreItemForEthSendTxn } from 'src/app/features/dappRequests/slice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { formatExternalTxnWithGasEstimates } from 'wallet/src/features/gas/formatExternalTxnWithGasEstimates'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'

interface UsePrepareAndSignDappTransactionParams {
  request: DappRequestStoreItemForEthSendTxn
  account: Account
  chainId?: UniverseChainId
}

interface UsePrepareAndSignDappTransactionResult {
  /** The gas fee result from estimation */
  gasFeeResult: GasFeeResult

  /** Whether the gas fee result is invalid */
  isInvalidGasFeeResult: boolean

  /** The request with gas values formatted */
  requestWithGasValues: DappRequestStoreItemForEthSendTxn

  /** The pre-signed transaction (available after gas info is loaded) */
  preSignedTransaction: SignedTransactionRequest | undefined
}

/**
 * Hook that fetches gas information for a dapp transaction and automatically
 * prepares and signs the transaction once gas info is available
 */
export function usePrepareAndSignEthSendTransaction({
  request,
  account,
  chainId,
}: UsePrepareAndSignDappTransactionParams): UsePrepareAndSignDappTransactionResult {
  const { gasFeeResult, isInvalidGasFeeResult } = useTransactionGasEstimation({
    baseTx: request.dappRequest.transaction,
    chainId,
    skip: !request.dappRequest.transaction,
  })

  const requestWithGasValues = useMemo(() => {
    const txnWithFormattedGasEstimates = formatExternalTxnWithGasEstimates({
      transaction: request.dappRequest.transaction,
      gasFeeResult,
    })

    return {
      ...request,
      dappRequest: {
        ...request.dappRequest,
        transaction: txnWithFormattedGasEstimates,
      },
    }
  }, [request, gasFeeResult])

  const { preSignedTransaction } = usePrepareAndSignDappTransaction({
    request: requestWithGasValues.dappRequest.transaction,
    account,
    chainId,
  })

  return {
    gasFeeResult,
    isInvalidGasFeeResult,
    requestWithGasValues,
    preSignedTransaction,
  }
}
