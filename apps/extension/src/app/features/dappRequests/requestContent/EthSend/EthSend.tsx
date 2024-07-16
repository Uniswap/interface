import { useCallback, useEffect, useMemo } from 'react'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { ApproveRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Approve/ApproveRequestContent'
import { FallbackEthSendRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/FallbackEthSend/FallbackEthSend'
import { LPRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/LP/LPRequestContent'
import { SwapRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapRequestContent'
import {
  DappRequestStoreItemForEthSendTxn,
  isApproveRequest,
  isLPRequest,
  isSwapRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { logger } from 'utilities/src/logger/logger'
import { formatExternalTxnWithGasEstimates } from 'wallet/src/features/gas/formatExternalTxnWithGasEstimates'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { GasFeeResult, GasSpeed } from 'wallet/src/features/gas/types'
import { TransactionTypeInfo } from 'wallet/src/features/transactions/types'

interface EthSendRequestContentProps {
  request: DappRequestStoreItemForEthSendTxn
}

export function EthSendRequestContent({ request }: EthSendRequestContentProps): JSX.Element {
  const { dappRequest } = request
  const { dappUrl, onConfirm, onCancel } = useDappRequestQueueContext()
  const chainId = useDappLastChainId(dappUrl)

  // Gas service requires a chain id
  const formattedTxnForGasQuery = { ...dappRequest.transaction, chainId }

  const transactionGasFeeResult = useTransactionGasFee(
    formattedTxnForGasQuery,
    /*speed=*/ GasSpeed.Urgent,
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
  return !!gasFeeResult.error || (!gasFeeResult.loading && (!gasFeeResult.params || !gasFeeResult.value))
}
