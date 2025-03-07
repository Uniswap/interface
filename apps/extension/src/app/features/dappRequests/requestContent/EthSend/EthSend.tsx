import { useCallback, useEffect, useMemo } from 'react'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { ApproveRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Approve/ApproveRequestContent'
import { FallbackEthSendRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/FallbackEthSend/FallbackEthSend'
import { LPRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/LP/LPRequestContent'
import { SwapRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapRequestContent'
import { DappRequestStoreItemForEthSendTxn } from 'src/app/features/dappRequests/slice'
import { isApproveRequest, isLPRequest, isSwapRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { formatExternalTxnWithGasEstimates } from 'wallet/src/features/gas/formatExternalTxnWithGasEstimates'

interface EthSendRequestContentProps {
  request: DappRequestStoreItemForEthSendTxn
}

export function EthSendRequestContent({ request }: EthSendRequestContentProps): JSX.Element {
  const { dappRequest } = request
  const { dappUrl, onConfirm, onCancel } = useDappRequestQueueContext()
  const chainId = useDappLastChainId(dappUrl)

  // Gas service requires a chain id
  const formattedTxnForGasQuery = useMemo(
    () => ({ ...dappRequest.transaction, chainId }),
    [dappRequest.transaction, chainId],
  )

  const transactionGasFeeResult = useTransactionGasFee(
    formattedTxnForGasQuery,
    /*skip=*/ !formattedTxnForGasQuery,
    /*pollingInterval=*/ PollingInterval.LightningMcQueen,
  )

  const isInvalidGasFeeResult = isInvalidGasFeeResultForEthSend(transactionGasFeeResult)

  useEffect(() => {
    if (isInvalidGasFeeResult) {
      logger.error(
        new Error(transactionGasFeeResult.error?.toString() ?? 'Empty gas fee result for dapp txn request.'),
        {
          tags: { file: 'features/dappRequests/DappRequestContent, ', function: 'DappRequest' },
          extra: { dappRequest },
        },
      )
    }
  }, [dappRequest, isInvalidGasFeeResult, transactionGasFeeResult])

  const requestWithGasValues = useMemo(() => {
    const txnWithFormattedGasEstimates = formatExternalTxnWithGasEstimates({
      transaction: dappRequest.transaction,
      gasFeeResult: transactionGasFeeResult,
    })

    return {
      ...request,
      dappRequest: {
        ...request.dappRequest,
        transaction: txnWithFormattedGasEstimates,
      },
    }
  }, [dappRequest.transaction, request, transactionGasFeeResult])

  const onConfirmRequest = useCallback(
    async (transactionTypeInfo?: TransactionTypeInfo) => {
      await onConfirm(requestWithGasValues, transactionTypeInfo)
    },
    [onConfirm, requestWithGasValues],
  )

  const onCancelRequest = useCallback(async () => {
    await onCancel(requestWithGasValues)
  }, [onCancel, requestWithGasValues])

  if (isSwapRequest(dappRequest)) {
    return (
      <SwapRequestContent
        dappRequest={dappRequest}
        transactionGasFeeResult={transactionGasFeeResult}
        onCancel={onCancelRequest}
        onConfirm={onConfirmRequest}
      />
    )
  } else if (isLPRequest(dappRequest)) {
    return (
      <LPRequestContent
        dappRequest={dappRequest}
        transactionGasFeeResult={transactionGasFeeResult}
        onCancel={onCancelRequest}
        onConfirm={onConfirmRequest}
      />
    )
  } else if (isApproveRequest(dappRequest)) {
    return (
      <ApproveRequestContent
        dappRequest={dappRequest}
        transactionGasFeeResult={transactionGasFeeResult}
        onCancel={onCancelRequest}
        onConfirm={onConfirmRequest}
      />
    )
  } else {
    return (
      <FallbackEthSendRequestContent
        dappRequest={dappRequest}
        transactionGasFeeResult={transactionGasFeeResult}
        onCancel={onCancelRequest}
        onConfirm={onConfirmRequest}
      />
    )
  }
}

function isInvalidGasFeeResultForEthSend(gasFeeResult: GasFeeResult): boolean {
  return !!gasFeeResult.error || (!gasFeeResult.isLoading && (!gasFeeResult.params || !gasFeeResult.value))
}
