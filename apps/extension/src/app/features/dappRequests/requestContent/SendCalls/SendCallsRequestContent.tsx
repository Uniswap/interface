import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { SwapRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapRequestContent'
import { DappRequestStoreItemForSendCallsTxn } from 'src/app/features/dappRequests/slice'
import {
  EthSendTransactionRPCActions,
  ParsedCall,
  SendCallsRequest,
  isBatchedSwapRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { UNISWAP_DELEGATION_ADDRESS } from 'uniswap/src/constants/addresses'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useWalletEncode7702Query } from 'uniswap/src/data/apiClients/tradingApi/useWalletEncode7702Query'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { TransactionType, TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { BatchedRequestDetailsContent } from 'wallet/src/components/BatchedTransactions/BatchedTransactionDetails'
import { transformCallsToTransactionRequests } from 'wallet/src/features/batchedTransactions/utils'
import { useLiveAccountDelegationDetails } from 'wallet/src/features/smartWallet/hooks/useLiveAccountDelegationDetails'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

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
  const { dappUrl, onConfirm, onCancel } = useDappRequestQueueContext()
  const chainId = useDappLastChainId(dappUrl) ?? request.dappInfo?.lastChainId
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const { dappRequest } = request

  const parsedSwapCalldata = useMemo(() => {
    return isBatchedSwapRequest(dappRequest)
      ? dappRequest.calls
          .filter((call): call is ParsedCall => 'parsedCalldata' in call)
          .find((call) => call.contractInteractions === EthSendTransactionRPCActions.Swap)?.parsedCalldata
      : undefined
  }, [dappRequest])

  const { data: encoded7702data } = useWalletEncode7702Query({
    enabled: !!chainId,
    params: {
      calls: chainId
        ? transformCallsToTransactionRequests({
            calls: dappRequest.calls,
            chainId,
            accountAddress: activeAccountAddress,
          })
        : [],
      smartContractDelegationAddress: UNISWAP_DELEGATION_ADDRESS,
      // @ts-ignore - walletAddress is needed for the API but not in the type yet
      // TODO: remove this once the API is updated
      // https://linear.app/uniswap/issue/API-1050/add-missing-walletaddress-field-to-api-endpoint-types-json
      walletAddress: activeAccountAddress,
    },
  })

  const delegationData = useLiveAccountDelegationDetails({
    address: activeAccountAddress,
    chainId,
  })

  const encodedTransaction = encoded7702data?.encoded
  const encodedRequestId = encoded7702data?.requestId

  const formattedTxnForGasQuery = useMemo(
    () => ({
      chainId,
      ...encodedTransaction,
    }),
    [chainId, encodedTransaction],
  )

  const transactionGasFeeResult = useTransactionGasFee({
    tx: formattedTxnForGasQuery,
    skip: !formattedTxnForGasQuery.to,
    refetchInterval: PollingInterval.LightningMcQueen,
    smartContractDelegationAddress: delegationData?.contractAddress,
  })

  const onConfirmRequest = useCallback(async () => {
    // encodedTransaction doesn't include gas info
    const txFormattedWithGasInfo = {
      ...encodedTransaction,
      gasLimit: transactionGasFeeResult.params?.gasLimit,
      gasPrice:
        transactionGasFeeResult.params && 'gasPrice' in transactionGasFeeResult.params
          ? transactionGasFeeResult.params.gasPrice
          : transactionGasFeeResult.params?.maxFeePerGas,
    }
    const transactionTypeInfo: TransactionTypeInfo = {
      type: TransactionType.SendCalls,
      encodedTransaction: txFormattedWithGasInfo,
      encodedRequestId,
    }
    await onConfirm({ request, transactionTypeInfo })
  }, [encodedTransaction, encodedRequestId, onConfirm, request, transactionGasFeeResult])

  const onCancelRequest = useCallback(async () => {
    await onCancel(request)
  }, [onCancel, request])

  return parsedSwapCalldata ? (
    <SwapRequestContent
      parsedCalldata={parsedSwapCalldata}
      transactionGasFeeResult={transactionGasFeeResult}
      showSmartWalletActivation={delegationData?.needsDelegation}
      onCancel={onCancelRequest}
      onConfirm={onConfirmRequest}
    />
  ) : (
    <SendCallsRequestContent
      dappRequest={dappRequest}
      transactionGasFeeResult={transactionGasFeeResult}
      showSmartWalletActivation={delegationData?.needsDelegation}
      onCancel={onCancelRequest}
      onConfirm={onConfirmRequest}
    />
  )
}
