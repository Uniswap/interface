import React from 'react'
import * as Progress from 'react-native-progress'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import AlertCircle from 'src/assets/icons/alert-circle.svg'
import Clock from 'src/assets/icons/clock.svg'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { AppNotificationType } from 'src/features/notifications/types'
import { useSortedPendingTransactions } from 'src/features/transactions/hooks'
import { TransactionStatus } from 'src/features/transactions/types'

const PENDING_TX_TIME_LIMIT = 60_000 * 5 // 5 mins

export function NotificationCenterLogo({ size = 24 }: { size?: number }) {
  const theme = useAppTheme()
  const pendingTransactions = useSortedPendingTransactions()
  const notificationQueue = useAppSelector((state) => state.notifications.notificationQueue)

  const currentNotification = notificationQueue[0]
  if (currentNotification?.type === AppNotificationType.Transaction) {
    const { txStatus } = currentNotification
    if (txStatus === TransactionStatus.Success) {
      return (
        <CheckmarkCircle
          borderColor="accentBackgroundSuccess"
          borderWidth={2}
          color={theme.colors.accentBackgroundSuccess}
          size={size}
        />
      )
    }

    return <AlertCircle color={theme.colors.accentBackgroundWarning} height={size} width={size} />
  }

  const pendingTransactionCount = pendingTransactions.length
  const txPendingLongerThanLimit =
    pendingTransactions[0] && Date.now() - pendingTransactions[0].addedTime > PENDING_TX_TIME_LIMIT

  // If a transaction has been pending for longer than 5 mins, don't show the spinner anymore
  if (pendingTransactionCount >= 1 && pendingTransactionCount <= 99 && !txPendingLongerThanLimit) {
    const spinnerSize = size + 4
    const countToDisplay = pendingTransactionCount === 1 ? undefined : pendingTransactionCount
    return (
      <Box position="relative">
        <Box
          alignItems="center"
          height={spinnerSize}
          justifyContent="center"
          position="absolute"
          width={spinnerSize}
          zIndex="modal">
          <Text textAlign="center" variant="badge">
            {countToDisplay}
          </Text>
        </Box>
        <Progress.CircleSnail
          direction={'clockwise'}
          indeterminate={true}
          size={spinnerSize}
          thickness={2.5}
        />
      </Box>
    )
  }

  return <Clock color={theme.colors.neutralTextTertiary} height={size} width={size} />
}
