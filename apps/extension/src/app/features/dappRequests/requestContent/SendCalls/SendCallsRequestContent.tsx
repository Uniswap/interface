import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { usePrepareAndSignSendCallsTransaction } from 'src/app/features/dappRequests/hooks/usePrepareAndSignSendCallsTransaction'
import { SwapRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapRequestContent'
import { DappRequestStoreItemForSendCallsTxn } from 'src/app/features/dappRequests/slice'
import {
  EthSendTransactionRPCActions,
  ParsedCall,
  SendCallsRequest,
  isBatchedSwapRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { TransactionType, TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { BatchedRequestDetailsContent } from 'wallet/src/components/BatchedTransactions/BatchedTransactionDetails'

interface SendCallsRequestContentProps {
  dappRequest: SendCallsRequest
  transactionGasFeeResult: GasFeeResult
  showSmartWalletActivation?: boolean
  onConfirm: (transactionTypeInfo?: TransactionTypeInfo) => Promise<void>
  onCancel: () => Promise<void>
}

function SendCallsRequestContent({
  dappRequest,
  transactionGasFeeResult,
  showSmartWalletActivation,
  onConfirm,
  onCancel,
}: SendCallsRequestContentProps): JSX.Element {
  const { t } = useTranslation()
  const { dappUrl } = useDappRequestQueueContext()
  const chainId = useDappLastChainId(dappUrl)

  return (
    <DappRequestContent
      chainId={chainId}
      confirmText={t('common.button.confirm')}
      title={t('dapp.request.base.title')}
      transactionGasFeeResult={transactionGasFeeResult}
      showNetworkCost
      disableConfirm={!transactionGasFeeResult.value}
      onCancel={onCancel}
      onConfirm={() => onConfirm()}
      contentHorizontalPadding="$none"
      showSmartWalletActivation={showSmartWalletActivation}
    >
      <BatchedRequestDetailsContent calls={dappRequest.calls} chainId={chainId} />
    </DappRequestContent>
  )
}

export function SendCallsRequestHandler({ request }: { request: DappRequestStoreItemForSendCallsTxn }): JSX.Element {
  const { dappUrl, currentAccount, onConfirm, onCancel } = useDappRequestQueueContext()
  const chainId = useDappLastChainId(dappUrl) ?? request.dappInfo?.lastChainId

  const { dappRequest } = request

  const parsedSwapCalldata = useMemo(() => {
    return isBatchedSwapRequest(dappRequest)
      ? dappRequest.calls
          .filter((call): call is ParsedCall => 'parsedCalldata' in call)
          .find((call) => call.contractInteractions === EthSendTransactionRPCActions.Swap)?.parsedCalldata
      : undefined
  }, [dappRequest])

  const { gasFeeResult, encodedTransactionRequest, encodedRequestId, showSmartWalletActivation, preSignedTransaction } =
    usePrepareAndSignSendCallsTransaction({
      request,
      account: currentAccount,
      chainId,
    })

  const onConfirmRequest = useCallback(async () => {
    const transactionTypeInfo: TransactionTypeInfo = {
      type: TransactionType.SendCalls,
      encodedTransaction: encodedTransactionRequest,
      encodedRequestId,
    }

    await onConfirm({
      request,
      transactionTypeInfo,
      preSignedTransaction,
    })
  }, [encodedTransactionRequest, encodedRequestId, onConfirm, preSignedTransaction, request])

  const onCancelRequest = useCallback(async () => {
    await onCancel(request)
  }, [onCancel, request])

  return parsedSwapCalldata ? (
    <SwapRequestContent
      parsedCalldata={parsedSwapCalldata}
      transactionGasFeeResult={gasFeeResult}
      showSmartWalletActivation={showSmartWalletActivation}
      onCancel={onCancelRequest}
      onConfirm={onConfirmRequest}
    />
  ) : (
    <SendCallsRequestContent
      dappRequest={dappRequest}
      transactionGasFeeResult={gasFeeResult}
      showSmartWalletActivation={showSmartWalletActivation}
      onCancel={onCancelRequest}
      onConfirm={onConfirmRequest}
    />
  )
}
