/* eslint-disable complexity */
import { ResponsiveValue } from '@shopify/restyle'
import dayjs from 'dayjs'
import { providers } from 'ethers'
import { default as React, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import SlashCircleIcon from 'src/assets/icons/slash-circle.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout'
import { Flex } from 'src/components/layout/Flex'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { ModalName } from 'src/features/telemetry/constants'
import { useLowestPendingNonce } from 'src/features/transactions/hooks'
import { cancelTransaction } from 'src/features/transactions/slice'
import { CancelConfirmationView } from 'src/features/transactions/SummaryCards/CancelConfirmationView'
import TransactionActionsModal from 'src/features/transactions/SummaryCards/TransactionActionsModal'
import { getTransactionSummaryTitle } from 'src/features/transactions/SummaryCards/utils'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { iconSizes } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'
import { openMoonpayTransactionLink, openTransactionLink } from 'src/utils/linking'

export const TXN_HISTORY_ICON_SIZE = iconSizes.icon40
const LOADING_SPINNER_SIZE = 20

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
  caption?: string
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

  const formattedAddedTime = useMemo(() => {
    const wrappedAddedTime = dayjs(transaction.addedTime)
    return dayjs().isBefore(wrappedAddedTime.add(59, 'minute'), 'minute')
      ? // We do not use dayjs.duration() as it uses Math.round under the hood,
        // so for the first 30s it would show 0 minutes
        `${Math.ceil(dayjs().diff(wrappedAddedTime) / 60000)}m` // withing an hour
      : dayjs().isBefore(wrappedAddedTime.add(24, 'hour'))
      ? wrappedAddedTime.format('h:mma') // withing last 24 hours
      : wrappedAddedTime.format('MMM D') // current year
  }, [transaction.addedTime])

  const rightBlock = inProgress ? (
    <SpinningLoader disabled={queued} size={LOADING_SPINNER_SIZE} />
  ) : transaction.status === TransactionStatus.Cancelled ||
    transaction.status === TransactionStatus.Cancelling ? (
    <SlashCircleIcon
      color={theme.colors.accentCritical}
      fill={theme.colors.background0}
      fillOpacity={1}
      height={theme.iconSizes.icon16}
      width={theme.iconSizes.icon16}
    />
  ) : transaction.status === TransactionStatus.Failed ? (
    <Box alignItems="flex-end" flexGrow={1} justifyContent="space-between">
      <AlertTriangle
        color={theme.colors.accentWarning}
        fill={theme.colors.background0}
        height={theme.iconSizes.icon16}
        width={theme.iconSizes.icon16}
      />
      {status === TransactionStatus.Failed && onRetry && (
        <Text color="accentActive" variant="buttonLabelSmall" onPress={onRetry}>
          {t('Retry')}
        </Text>
      )}
    </Box>
  ) : (
    <Text color="textTertiary" variant="bodyMicro">
      {formattedAddedTime}
    </Text>
  )

  return (
    <>
      <TouchableArea mb="spacing24" overflow="hidden" onPress={onPress}>
        <Flex
          grow
          row
          alignItems="flex-start"
          bg={bg ?? 'background0'}
          borderRadius="rounded16"
          justifyContent="space-between">
          <Flex
            row
            shrink
            alignItems="center"
            gap="spacing12"
            height="100%"
            justifyContent="flex-start"
            pr="spacing8">
            {icon && (
              <Flex centered height={TXN_HISTORY_ICON_SIZE} width={TXN_HISTORY_ICON_SIZE}>
                {icon}
              </Flex>
            )}
            <Flex shrink gap="none">
              <Flex row alignItems="center" gap="spacing4">
                <Text numberOfLines={1} variant="bodyLarge">
                  {title}
                </Text>
                {chainId !== ChainId.Mainnet && <InlineNetworkPill chainId={chainId} />}
              </Flex>
              {caption && (
                <Text color="textSecondary" numberOfLines={1} variant="subheadSmall">
                  {caption}
                </Text>
              )}
            </Flex>
          </Flex>
          <Flex
            height={inProgress ? '100%' : undefined}
            justifyContent={inProgress ? 'center' : undefined}>
            {rightBlock}
          </Flex>
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

export function AssetUpdateLayout({
  title,
  caption,
}: {
  title: string | undefined
  caption?: string | undefined
}): JSX.Element {
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
