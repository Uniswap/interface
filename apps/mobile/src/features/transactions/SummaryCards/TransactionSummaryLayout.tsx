/* eslint-disable complexity */
import { ResponsiveValue } from '@shopify/restyle'
import dayjs from 'dayjs'
import { providers } from 'ethers'
import { default as React, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout'
import { Flex } from 'src/components/layout/Flex'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'
import { useLowestPendingNonce } from 'src/features/transactions/hooks'
import { cancelTransaction } from 'src/features/transactions/slice'
import { CancelConfirmationView } from 'src/features/transactions/SummaryCards/CancelConfirmationView'
import TransactionActionsModal from 'src/features/transactions/SummaryCards/TransactionActionsModal'
import { getTransactionSummaryTitle } from 'src/features/transactions/SummaryCards/utils'
import { openMoonpayTransactionLink, openTransactionLink } from 'src/utils/linking'
import AlertTriangle from 'ui/assets/icons/alert-triangle.svg'
import SlashCircleIcon from 'ui/assets/icons/slash-circle.svg'
import { iconSizes } from 'ui/theme/iconSizes'
import { Theme } from 'ui/theme/restyle/theme'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { ONE_MINUTE_MS } from 'wallet/src/utils/time'
import { useInterval } from 'wallet/src/utils/timing'

export const TXN_HISTORY_ICON_SIZE = iconSizes.icon40
const LOADING_SPINNER_SIZE = 20

function useForceUpdateEveryMinute(): number {
  const [unixTime, setUnixTime] = useState(Date.now())
  useInterval(() => {
    setUnixTime(Date.now())
  }, ONE_MINUTE_MS)
  return unixTime
}

function TransactionSummaryLayout({
  transaction,
  title,
  caption,
  bg,
  icon,
  onRetry,
}: {
  transaction: TransactionDetails
  title?: string
  caption: string
  bg?: ResponsiveValue<keyof Theme['colors'], Theme>
  icon?: JSX.Element
  onRetry?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const { type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly

  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const dispatch = useAppDispatch()

  const { status, addedTime, hash, chainId, typeInfo } = transaction

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

  const onPress = (): void => {
    if (readonly) {
      openTransactionLink(hash, chainId)
    } else {
      setShowActionsModal(true)
    }
  }

  // we need to update formattedAddedTime every minute as it can be relative
  const unixTime = useForceUpdateEveryMinute()

  const formattedAddedTime = useMemo(() => {
    const wrappedAddedTime = dayjs(transaction.addedTime)
    return dayjs().isBefore(wrappedAddedTime.add(59, 'minute'), 'minute')
      ? // We do not use dayjs.duration() as it uses Math.round under the hood,
        // so for the first 30s it would show 0 minutes
        `${Math.ceil(dayjs().diff(wrappedAddedTime) / ONE_MINUTE_MS)}m` // within an hour
      : dayjs().isBefore(wrappedAddedTime.add(24, 'hour'))
      ? wrappedAddedTime.format('h:mma') // within last 24 hours
      : wrappedAddedTime.format('MMM D') // current year
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction.addedTime, unixTime])

  const statusIconSize = theme.iconSizes.icon16
  const statusIconFill = theme.colors.background0

  const rightBlock = inCancelling ? (
    <SlashCircleIcon
      color={theme.colors.accentCritical}
      fill={statusIconFill}
      fillOpacity={1}
      height={statusIconSize}
      width={statusIconSize}
    />
  ) : status === TransactionStatus.Failed ? (
    <Box alignItems="flex-end" flexGrow={1} justifyContent="space-between">
      <AlertTriangle
        color={theme.colors.accentWarning}
        fill={statusIconFill}
        height={statusIconSize}
        width={statusIconSize}
      />
    </Box>
  ) : (
    <Text color="textTertiary" variant="bodyMicro">
      {formattedAddedTime}
    </Text>
  )

  return (
    <>
      <TouchableArea mb="spacing24" overflow="hidden" onPress={onPress}>
        <Flex grow row bg={bg ?? 'background0'} gap="spacing12">
          {icon && (
            <Flex centered width={TXN_HISTORY_ICON_SIZE}>
              {icon}
            </Flex>
          )}
          <Flex grow shrink gap="none">
            <Flex grow gap="none">
              <Flex grow row alignItems="center" gap="spacing4" justifyContent="space-between">
                <Text color="textSecondary" numberOfLines={1} variant="bodyLarge">
                  {title}
                </Text>
                {!inProgress && rightBlock}
              </Flex>
              <Flex grow row>
                <Box flexGrow={1} flexShrink={1}>
                  <Text color="textPrimary" variant="bodyLarge">
                    {caption}
                  </Text>
                </Box>
                {status === TransactionStatus.Failed && onRetry && (
                  <Box flexShrink={0}>
                    <Text color="accentActive" variant="buttonLabelSmall" onPress={onRetry}>
                      {t('Retry')}
                    </Text>
                  </Box>
                )}
              </Flex>
            </Flex>
          </Flex>
          {inProgress && (
            <Flex height="100%" justifyContent="center">
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

export default TransactionSummaryLayout
