import { type GasFeeResult } from '@universe/api'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { usePrepareAndSignSendCallsTransaction } from 'src/app/features/dappRequests/hooks/usePrepareAndSignSendCallsTransaction'
import { SwapRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapRequestContent'
import { type DappRequestStoreItemForSendCallsTxn } from 'src/app/features/dappRequests/slice'
import {
  EthSendTransactionRPCActions,
  isBatchedSwapRequest,
  type ParsedCall,
  type SendCallsRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionType, type TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { BatchedRequestDetailsContent } from 'wallet/src/components/BatchedTransactions/BatchedTransactionDetails'
import { DappSendCallsScanningContent } from 'wallet/src/components/dappRequests/DappSendCallsScanningContent'
import { type TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import { shouldDisableConfirm } from 'wallet/src/features/dappRequests/utils/riskUtils'

interface SendCallsRequestContentProps {
  dappRequest: SendCallsRequest
  transactionGasFeeResult: GasFeeResult
  showSmartWalletActivation?: boolean
  onConfirm: (transactionTypeInfo?: TransactionTypeInfo) => Promise<void>
  onCancel: () => Promise<void>
}

/**
 * Implementation with Blockaid scanning
 */
function SendCallsRequestContentWithScanning({
  dappRequest,
  chainId,
  transactionGasFeeResult,
  showSmartWalletActivation,
  onConfirm,
  onCancel,
}: SendCallsRequestContentProps & { chainId: UniverseChainId }): JSX.Element {
  const { t } = useTranslation()
  const { dappUrl, currentAccount } = useDappRequestQueueContext()
  const { value: confirmedRisk, setValue: setConfirmedRisk } = useBooleanState(false)
  // Initialize with null to indicate scan hasn't completed yet
  const [riskLevel, setRiskLevel] = useState<TransactionRiskLevel | null>(null)

  const disableConfirm = shouldDisableConfirm({
    riskLevel,
    confirmedRisk,
    hasGasFee: !!transactionGasFeeResult.value,
  })

  return (
    <DappRequestContent
      chainId={chainId}
      confirmText={t('common.button.confirm')}
      title={t('dapp.request.base.title')}
      transactionGasFeeResult={transactionGasFeeResult}
      disableConfirm={disableConfirm}
      onCancel={onCancel}
      onConfirm={() => onConfirm()}
      showAddressFooter={false}
    >
      <DappSendCallsScanningContent
        chainId={chainId}
        account={currentAccount.address}
        calls={dappRequest.calls}
        dappUrl={dappUrl}
        gasFee={transactionGasFeeResult}
        requestMethod={dappRequest.type}
        showSmartWalletActivation={showSmartWalletActivation}
        confirmedRisk={confirmedRisk}
        onConfirmRisk={setConfirmedRisk}
        onRiskLevelChange={setRiskLevel}
      />
    </DappRequestContent>
  )
}

/**
 * Fallback for when chainId is not available (required for Blockaid scanning)
 */
function SendCallsRequestContentFallback({
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

  if (chainId) {
    return (
      <SendCallsRequestContentWithScanning
        dappRequest={dappRequest}
        chainId={chainId}
        transactionGasFeeResult={gasFeeResult}
        showSmartWalletActivation={showSmartWalletActivation}
        onCancel={onCancelRequest}
        onConfirm={onConfirmRequest}
      />
    )
  }

  if (parsedSwapCalldata) {
    return (
      <SwapRequestContent
        parsedCalldata={parsedSwapCalldata}
        transactionGasFeeResult={gasFeeResult}
        showSmartWalletActivation={showSmartWalletActivation}
        onCancel={onCancelRequest}
        onConfirm={onConfirmRequest}
      />
    )
  }

  return (
    <SendCallsRequestContentFallback
      dappRequest={dappRequest}
      transactionGasFeeResult={gasFeeResult}
      showSmartWalletActivation={showSmartWalletActivation}
      onConfirm={onConfirmRequest}
      onCancel={onCancelRequest}
    />
  )
}
