import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback } from 'react'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { usePrepareAndSignEthSendTransaction } from 'src/app/features/dappRequests/hooks/usePrepareAndSignEthSendTransaction'
import { ApproveRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Approve/ApproveRequestContent'
import { FallbackEthSendRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/FallbackEthSend/FallbackEthSend'
import { LPRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/LP/LPRequestContent'
import { ParsedTransactionRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/ParsedTransaction/ParsedTransactionRequestContent'
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
  SendTransactionRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
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
  const blockaidTransactionScanning = useFeatureFlag(FeatureFlags.BlockaidTransactionScanning)

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

  // If Blockaid transaction scanning is enabled, try to use it for ALL transaction types
  // If the API fails, the ErrorBoundary will catch it and fallback to specialized UIs
  if (blockaidTransactionScanning) {
    return (
      <ErrorBoundary
        fallback={
          <SpecializedTransactionFallback
            dappRequest={dappRequest}
            transactionGasFeeResult={transactionGasFeeResult}
            onCancel={onCancelRequest}
            onConfirm={onConfirmRequest}
          />
        }
        onError={(error) => {
          if (error) {
            logger.error(error, {
              tags: { file: 'EthSend', function: 'ErrorBoundary-Blockaid' },
              extra: {
                dappRequest,
                useSimulationResultUI: true,
              },
            })
          }
        }}
      >
        <ParsedTransactionRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancelRequest}
          onConfirm={onConfirmRequest}
        />
      </ErrorBoundary>
    )
  }

  // If feature flag is disabled, use specialized UIs
  const content = (
    <SpecializedTransactionFallback
      dappRequest={dappRequest}
      transactionGasFeeResult={transactionGasFeeResult}
      onCancel={onCancelRequest}
      onConfirm={onConfirmRequest}
    />
  )

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
            tags: { file: 'EthSend', function: 'ErrorBoundary-Specialized' },
            extra: {
              dappRequest,
              useSimulationResultUI: false,
            },
          })
        }
      }}
    >
      {content}
    </ErrorBoundary>
  )
}

/**
 * Fallback component that renders the appropriate specialized UI based on transaction type
 * Used when simulation result UI is disabled or fails
 */
function SpecializedTransactionFallback({
  dappRequest,
  transactionGasFeeResult,
  onCancel,
  onConfirm,
}: {
  dappRequest: SendTransactionRequest
  transactionGasFeeResult: GasFeeResult
  onCancel: () => Promise<void>
  onConfirm: (transactionTypeInfo?: TransactionTypeInfo) => Promise<void>
}): JSX.Element {
  switch (true) {
    case isSwapRequest(dappRequest):
      return (
        <SwapRequestContent
          parsedCalldata={dappRequest.parsedCalldata}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )
    case isPermit2ApproveRequest(dappRequest):
      return (
        <Permit2ApproveRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )
    case isWrapRequest(dappRequest):
      return (
        <WrapRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )
    case isLPRequest(dappRequest):
      return (
        <LPRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )
    case isApproveRequest(dappRequest):
      return (
        <ApproveRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )
    default:
      return (
        <FallbackEthSendRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )
  }
}
