import { useCallback, useEffect, useMemo } from 'react'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { ApproveRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Approve/ApproveRequestContent'
import { FallbackEthSendRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/FallbackEthSend/FallbackEthSend'
import { LPRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/LP/LPRequestContent'
import { Permit2ApproveRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Permit2Approve/Permit2ApproveRequestContent'
import { SwapRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapRequestContent'
import { WrapRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Wrap/WrapRequestContent'
import { DappRequestStoreItemForEthSendTxn } from 'src/app/features/dappRequests/slice'
import {
  isApproveRequest,
  isLPRequest,
  isPermit2ApproveRequest,
  isSwapRequest,
  isWrapRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
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

  const transactionGasFeeResult = useTransactionGasFee({
    tx: formattedTxnForGasQuery,
    skip: !formattedTxnForGasQuery,
    refetchInterval: PollingInterval.LightningMcQueen,
  })

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
      await onConfirm({
        request: requestWithGasValues,
        transactionTypeInfo,
      })
    },
    [onConfirm, requestWithGasValues],
  )

  const onCancelRequest = useCallback(async () => {
    await onCancel(requestWithGasValues)
  }, [onCancel, requestWithGasValues])

  let content
  switch (true) {
    case isSwapRequest(dappRequest):
      content = (
        <SwapRequestContent
          parsedCalldata={dappRequest.parsedCalldata}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancelRequest}
          onConfirm={onConfirmRequest}
        />
      )
      break
    case isPermit2ApproveRequest(dappRequest):
      content = (
        <Permit2ApproveRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancelRequest}
          onConfirm={onConfirmRequest}
        />
      )
      break
    case isWrapRequest(dappRequest):
      content = (
        <WrapRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancelRequest}
          onConfirm={onConfirmRequest}
        />
      )
      break
    case isLPRequest(dappRequest):
      content = (
        <LPRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancelRequest}
          onConfirm={onConfirmRequest}
        />
      )
      break
    case isApproveRequest(dappRequest):
      content = (
        <ApproveRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancelRequest}
          onConfirm={onConfirmRequest}
        />
      )
      break
    default:
      content = (
        <FallbackEthSendRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancelRequest}
          onConfirm={onConfirmRequest}
        />
      )
  }

  return (
    <ErrorBoundary
      fallback={
        <FallbackEthSendRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancelRequest}
          onConfirm={onConfirmRequest}
        />
      }
      onError={(error) => {
        if (error) {
          logger.error(error, {
            tags: { file: 'SignTypedDataRequestContent', function: 'ErrorBoundary' },
            extra: {
              dappRequest,
            },
          })
        }
      }}
    >
      {content}
    </ErrorBoundary>
  )
}

function isInvalidGasFeeResultForEthSend(gasFeeResult: GasFeeResult): boolean {
  return !!gasFeeResult.error || (!gasFeeResult.isLoading && (!gasFeeResult.params || !gasFeeResult.value))
}
