import { providers } from 'ethers'
import { default as React, ReactElement, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { BaseButtonProps, TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout/Flex'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { ModalName } from 'src/features/telemetry/constants'
import { useLowestPendingNonce } from 'src/features/transactions/hooks'
import { cancelTransaction } from 'src/features/transactions/slice'
import AlertBanner from 'src/features/transactions/SummaryCards/AlertBanner'
import { CancelConfirmationView } from 'src/features/transactions/SummaryCards/CancelConfirmationView'
import TransactionActionsModal from 'src/features/transactions/SummaryCards/TransactionActionsModal'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { iconSizes } from 'src/styles/sizing'
import { openTransactionLink } from 'src/utils/linking'

export const TXN_HISTORY_ICON_SIZE = iconSizes.xxl
const LOADING_SPINNER_SIZE = 20

function TransactionSummaryLayout({
  transaction,
  title,
  caption,
  endAdornment,
  icon,
  readonly,
  bg,
  ...rest
}: {
  transaction: TransactionDetails
  title: string
  caption: string | undefined
  readonly: boolean
  endAdornment?: ReactElement
  icon?: ReactElement
} & BaseButtonProps) {
  const { t } = useTranslation()

  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const dispatch = useAppDispatch()

  const { status, addedTime, hash, chainId } = transaction

  const showAlertBanner =
    status === TransactionStatus.Cancelled ||
    status === TransactionStatus.Cancelling ||
    status === TransactionStatus.FailedCancel
  const inProgress = status === TransactionStatus.Cancelling || status === TransactionStatus.Pending
  const showBackground = showAlertBanner || inProgress

  // Monitor latest nonce to identify queued transactions.
  const lowestPendingNonce = useLowestPendingNonce()
  const nonce = transaction?.options?.request?.nonce
  const queued = nonce && lowestPendingNonce ? nonce > lowestPendingNonce : false

  const isCancelable =
    status === TransactionStatus.Pending && !readonly && Boolean(transaction.options?.request)

  function handleCancel(txRequest: providers.TransactionRequest) {
    if (!transaction) return
    dispatch(
      cancelTransaction({
        chainId: transaction.chainId,
        id: transaction.id,
        address: transaction.from,
        cancelRequest: txRequest,
      })
    )
    setShowCancelModal(false)
  }

  // Hide cancelation modal if transaction is no longer pending.
  useEffect(() => {
    if (status !== TransactionStatus.Pending) {
      setShowCancelModal(false)
    }
  }, [status])

  const onPress = () => {
    if (readonly) {
      openTransactionLink(hash, chainId)
    } else {
      setShowActionsModal(true)
    }
  }

  return (
    <>
      <TouchableArea overflow="hidden" onPress={onPress} {...rest}>
        {showAlertBanner && <AlertBanner status={status} />}
        <Flex
          grow
          row
          alignItems="flex-start"
          bg={showBackground ? 'background2' : bg ?? 'background0'}
          borderRadius="lg"
          borderTopLeftRadius={showAlertBanner ? 'none' : 'lg'}
          borderTopRightRadius={showAlertBanner ? 'none' : 'lg'}
          gap="md"
          justifyContent="space-between"
          mb={showBackground ? 'sm' : 'none'}
          p="sm">
          <Flex row alignItems="center" gap="sm" height="100%" justifyContent="flex-start">
            {icon && (
              <Flex centered height={TXN_HISTORY_ICON_SIZE} width={TXN_HISTORY_ICON_SIZE}>
                {icon}
              </Flex>
            )}
            <Flex grow gap="none">
              <Flex row alignItems="center" gap="xxs">
                <Text numberOfLines={1} variant="bodyLarge">
                  {title}
                </Text>
                {chainId !== ChainId.Mainnet && <InlineNetworkPill chainId={chainId} />}
              </Flex>
              {caption && (
                <Text color="textSecondary" variant="subheadSmall">
                  {caption}
                </Text>
              )}
            </Flex>
          </Flex>
          {inProgress ? (
            <Flex alignItems="flex-end" gap="xxxs">
              <SpinningLoader disabled={queued} size={LOADING_SPINNER_SIZE} />
              {queued ? (
                <Text color="textSecondary" variant="subheadSmall">
                  {t('Queued')}
                </Text>
              ) : inProgress ? (
                <Text color="textSecondary" variant="subheadSmall">
                  {t('Pending')}
                </Text>
              ) : null}
            </Flex>
          ) : (
            endAdornment
          )}
        </Flex>
      </TouchableArea>
      {showActionsModal && (
        <TransactionActionsModal
          hash={hash}
          msTimestampAdded={addedTime}
          showCancelButton={isCancelable}
          transactionDetails={transaction}
          onCancel={() => {
            setShowActionsModal(false)
            setShowCancelModal(true)
          }}
          onClose={() => setShowActionsModal(false)}
          onExplore={() => openTransactionLink(hash, chainId)}
        />
      )}

      {showCancelModal && (
        <BottomSheetModal
          hideHandlebar={false}
          name={ModalName.TransactionActions}
          onClose={() => setShowCancelModal(false)}>
          {transaction && (
            <CancelConfirmationView
              transactionDetails={transaction}
              onBack={() => {
                setShowActionsModal(true)
                setShowCancelModal(false)
              }}
              onCancel={handleCancel}
            />
          )}
        </BottomSheetModal>
      )}
    </>
  )
}

export default TransactionSummaryLayout

export function AssetUpdateLayout({
  title,
  caption,
}: {
  title: string | undefined
  caption?: string | undefined
}) {
  return (
    <Flex shrink alignItems="flex-end" gap="none">
      <Text numberOfLines={1} variant="bodyLarge">
        {title}
      </Text>
      {caption && (
        <Text color="textSecondary" numberOfLines={1} variant="bodySmall">
          {caption}
        </Text>
      )}
    </Flex>
  )
}
