/* eslint-disable complexity */
import { providers } from 'ethers'
import { default as React, memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { ModalName } from 'src/features/telemetry/constants'
import { useLowestPendingNonce } from 'src/features/transactions/hooks'
import { CancelConfirmationView } from 'src/features/transactions/SummaryCards/CancelConfirmationView'
import TransactionActionsModal from 'src/features/transactions/SummaryCards/TransactionActionsModal'
import { openMoonpayTransactionLink, openTransactionLink } from 'src/utils/linking'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import AlertTriangle from 'ui/src/assets/icons/alert-triangle.svg'
import SlashCircleIcon from 'ui/src/assets/icons/slash-circle.svg'
import { cancelTransaction } from 'wallet/src/features/transactions/slice'
import { TransactionSummaryLayoutProps } from 'wallet/src/features/transactions/SummaryCards/types'
import {
  getTransactionSummaryTitle,
  TXN_HISTORY_ICON_SIZE,
  TXN_STATUS_ICON_SIZE,
  useFormattedTime,
} from 'wallet/src/features/transactions/SummaryCards/utils'
import { TransactionStatus, TransactionType } from 'wallet/src/features/transactions/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow, useDisplayName } from 'wallet/src/features/wallet/hooks'
import { CurrencyId } from 'wallet/src/utils/currencyId'

const LOADING_SPINNER_SIZE = 20

function TransactionSummaryLayout({
  transaction,
  title,
  caption,
  icon,
  onRetry,
}: TransactionSummaryLayoutProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const { type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly

  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const dispatch = useAppDispatch()

  const { status, addedTime, hash, chainId, typeInfo } = transaction

  const walletDisplayName = useDisplayName(transaction.ownerAddress)

  title = title ?? getTransactionSummaryTitle(transaction, t) ?? ''

  const inProgress = status === TransactionStatus.Cancelling || status === TransactionStatus.Pending
  const inCancelling =
    status === TransactionStatus.Cancelled || status === TransactionStatus.Cancelling

  // Monitor latest nonce to identify queued transactions.
  const lowestPendingNonce = useLowestPendingNonce()
  const nonce = transaction?.options?.request?.nonce
  const queued = nonce && lowestPendingNonce ? nonce > lowestPendingNonce : false

  const isCancelable =
    status === TransactionStatus.Pending &&
    !readonly &&
    Object.keys(transaction.options?.request).length > 0

  function handleCancel(txRequest: providers.TransactionRequest): void {
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

  const onPress = async (): Promise<void> => {
    if (readonly) {
      await openTransactionLink(hash, chainId)
    } else {
      setShowActionsModal(true)
    }
  }

  const formattedAddedTime = useFormattedTime(transaction.addedTime)

  const statusIconFill = colors.surface1.get()

  const rightBlock = inCancelling ? (
    <SlashCircleIcon
      color={colors.statusCritical.val}
      fill={statusIconFill}
      fillOpacity={1}
      height={TXN_STATUS_ICON_SIZE}
      width={TXN_STATUS_ICON_SIZE}
    />
  ) : status === TransactionStatus.Failed ? (
    <Flex grow alignItems="flex-end" justifyContent="space-between">
      <AlertTriangle
        color={colors.DEP_accentWarning.val}
        fill={statusIconFill}
        height={TXN_STATUS_ICON_SIZE}
        width={TXN_STATUS_ICON_SIZE}
      />
    </Flex>
  ) : (
    <Text color="$neutral3" variant="body3">
      {formattedAddedTime}
    </Text>
  )

  return (
    <>
      <TouchableArea mb="$spacing24" overflow="hidden" onPress={onPress}>
        <Flex grow row bg="$surface1" gap="$spacing12">
          {icon && (
            <Flex centered width={TXN_HISTORY_ICON_SIZE}>
              {icon}
            </Flex>
          )}
          <Flex grow shrink>
            <Flex grow>
              <Flex grow row alignItems="center" gap="$spacing4" justifyContent="space-between">
                <Flex row alignItems="center" gap="$spacing4">
                  {walletDisplayName?.name ? (
                    <Text color="$accent1" numberOfLines={1} variant="body1">
                      {walletDisplayName.name}
                    </Text>
                  ) : null}
                  <Text color="$neutral2" numberOfLines={1} variant="body2">
                    {title}
                  </Text>
                </Flex>
                {!inProgress && rightBlock}
              </Flex>
              <Flex grow row gap="$spacing16">
                <Flex grow shrink>
                  <Text color="$neutral1" variant="body2">
                    {caption}
                  </Text>
                </Flex>
                {status === TransactionStatus.Failed && onRetry && (
                  <Flex flexShrink={0}>
                    <Text color="$accent1" variant="buttonLabel3" onPress={onRetry}>
                      {t('Retry')}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Flex>
          {inProgress && (
            <Flex justifyContent="center">
              <SpinningLoader disabled={queued} size={LOADING_SPINNER_SIZE} />
            </Flex>
          )}
        </Flex>
      </TouchableArea>
      {showActionsModal && (
        <TransactionActionsModal
          msTimestampAdded={addedTime}
          showCancelButton={isCancelable}
          transactionDetails={transaction}
          onCancel={(): void => {
            setShowActionsModal(false)
            setShowCancelModal(true)
          }}
          onClose={(): void => setShowActionsModal(false)}
          onExplore={(): Promise<void> => {
            setShowActionsModal(false)
            return openTransactionLink(hash, chainId)
          }}
          onViewMoonpay={
            typeInfo.type === TransactionType.FiatPurchase &&
            // only display `View on Moonpay` when an explorer url was provided by Moonpay
            typeInfo.explorerUrl
              ? (): Promise<void> | undefined => {
                  setShowActionsModal(false)
                  // avoids type casting
                  return transaction.typeInfo.type === TransactionType.FiatPurchase
                    ? openMoonpayTransactionLink(transaction.typeInfo)
                    : undefined
                }
              : undefined
          }
          onViewTokenDetails={
            typeInfo.type === TransactionType.Swap
              ? (currencyId: CurrencyId): void | undefined => {
                  setShowActionsModal(false)
                  if (transaction.typeInfo.type === TransactionType.Swap) {
                    tokenDetailsNavigation.navigate(currencyId)
                  }
                }
              : undefined
          }
        />
      )}
      {showCancelModal && (
        <BottomSheetModal
          hideHandlebar={false}
          name={ModalName.TransactionActions}
          onClose={(): void => setShowCancelModal(false)}>
          {transaction && (
            <CancelConfirmationView
              transactionDetails={transaction}
              onBack={(): void => {
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

export default memo(TransactionSummaryLayout)
