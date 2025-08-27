import { useCallback } from 'react'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { usePrepareAndSignEthSendTransaction } from 'src/app/features/dappRequests/hooks/usePrepareAndSignEthSendTransaction'
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
import { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'

interface EthSendRequestContentProps {
  request: DappRequestStoreItemForEthSendTxn
}

export function EthSendRequestContent({ request }: EthSendRequestContentProps): JSX.Element {
  const { dappRequest } = request
  const { dappUrl, currentAccount, onConfirm, onCancel } = useDappRequestQueueContext()
  const chainId = useDappLastChainId(dappUrl)

  const {
    gasFeeResult: transactionGasFeeResult,
    requestWithGasValues,
    preSignedTransaction,
  } = usePrepareAndSignEthSendTransaction({
    request,
    account: currentAccount,
    chainId,
  })

  const onConfirmRequest = useCallback(
    async (transactionTypeInfo?: TransactionTypeInfo) => {
      await onConfirm({
        request: requestWithGasValues,
        transactionTypeInfo,
        preSignedTransaction,
      })
    },
    [onConfirm, requestWithGasValues, preSignedTransaction],
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
            tags: { file: 'EthSend', function: 'ErrorBoundary' },
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
