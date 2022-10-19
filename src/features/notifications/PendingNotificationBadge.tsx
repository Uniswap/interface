import React from 'react'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { useEagerActivityNavigation } from 'src/app/navigation/hooks'
import AlertCircle from 'src/assets/icons/alert-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { TxHistoryIconWithStatus } from 'src/components/icons/TxHistoryIconWithStatus'
import { Box } from 'src/components/layout/Box'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Text } from 'src/components/Text'
import { selectActiveAccountNotifications } from 'src/features/notifications/selectors'
import { AppNotificationType } from 'src/features/notifications/types'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'

const PENDING_TX_TIME_LIMIT = 60_000 * 5 // 5 mins
const LOADING_SPINNER_SIZE = 26

interface Props {
  size?: number
  sortedPendingTransactions: TransactionDetails[]
}

export function PendingNotificationBadge({ size = 24, sortedPendingTransactions }: Props) {
  const theme = useAppTheme()
  const activeAccountAddress = useAppSelector(selectActiveAccountAddress)
  const notifications = useAppSelector(selectActiveAccountNotifications)

  const { preload, navigate } = useEagerActivityNavigation()

  const currentNotification = notifications[0]
  if (currentNotification?.type === AppNotificationType.Transaction) {
    const { txStatus } = currentNotification
    if (txStatus === TransactionStatus.Success) {
      return (
        <CheckmarkCircle
          borderColor="accentSuccess"
          borderWidth={2}
          color={theme.colors.accentSuccess}
          size={size}
        />
      )
    }

    return <AlertCircle color={theme.colors.accentWarning} height={size} width={size} />
  }

  const pendingTransactionCount = sortedPendingTransactions.length
  const txPendingLongerThanLimit =
    sortedPendingTransactions[0] &&
    Date.now() - sortedPendingTransactions[0].addedTime > PENDING_TX_TIME_LIMIT

  // If a transaction has been pending for longer than 5 mins, then show the normal tx history icon
  if (pendingTransactionCount < 1 || pendingTransactionCount > 99 || txPendingLongerThanLimit) {
    return <TxHistoryIconWithStatus />
  }

  const countToDisplay = pendingTransactionCount === 1 ? undefined : pendingTransactionCount

  return (
    <Button
      position="relative"
      onPress={() => (activeAccountAddress ? navigate(activeAccountAddress) : null)}
      onPressIn={() => (activeAccountAddress ? preload(activeAccountAddress) : null)}>
      <Box
        alignItems="center"
        height={size}
        justifyContent="center"
        left={1}
        position="absolute"
        top={2}
        width={size}
        zIndex="modal">
        <Text textAlign="center" variant="badge_deprecated">
          {countToDisplay}
        </Text>
      </Box>
      <SpinningLoader size={LOADING_SPINNER_SIZE} />
    </Button>
  )
}
