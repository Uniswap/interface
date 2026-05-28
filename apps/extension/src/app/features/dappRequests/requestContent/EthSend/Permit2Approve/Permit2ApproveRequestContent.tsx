import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { Permit2ApproveSendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Flex, Text } from 'ui/src'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { TransactionType, TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'

interface Permit2ApproveRequestContentProps {
  transactionGasFeeResult: GasFeeResult
  dappRequest: Permit2ApproveSendTransactionRequest
  onCancel: () => Promise<void>
  onConfirm: (transactionTypeInfo?: TransactionTypeInfo) => Promise<void>
}

export function Permit2ApproveRequestContent({
  dappRequest,
  transactionGasFeeResult,
  onCancel,
  onConfirm,
}: Permit2ApproveRequestContentProps): JSX.Element {
  const { t } = useTranslation()
  const transactionTypeInfo: TransactionTypeInfo | undefined = dappRequest.transaction.to
    ? {
        type: TransactionType.Permit2Approve,
        spender: dappRequest.transaction.to,
      }
    : undefined
  const onConfirmWithTransactionTypeInfo = (): Promise<void> => onConfirm(transactionTypeInfo)

  return (
    <DappRequestContent
      contentHorizontalPadding="$spacing12"
      showNetworkCost
      confirmText={t('dapp.request.permit2approve.action')}
      title={t('dapp.request.permit2approve.title')}
      transactionGasFeeResult={transactionGasFeeResult}
      onCancel={onCancel}
      onConfirm={onConfirmWithTransactionTypeInfo}
    >
      <Flex
        backgroundColor="$surface2"
        borderColor="$surface3"
        borderRadius="$rounded12"
        borderWidth="$spacing1"
        gap="$spacing4"
        p="$spacing12"
      >
        <Text color="$neutral2" variant="body4">
          {t('dapp.request.permit2approve.helptext')}
        </Text>
      </Flex>
    </DappRequestContent>
  )
}
