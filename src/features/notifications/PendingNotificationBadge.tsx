import React from 'react'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import AlertCircle from 'src/assets/icons/alert-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { Box } from 'src/components/layout'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Text } from 'src/components/Text'
import { selectActiveAccountNotifications } from 'src/features/notifications/selectors'
import { AppNotificationType } from 'src/features/notifications/types'
import { useSortedPendingTransactions } from 'src/features/transactions/hooks'
import { TransactionStatus } from 'src/features/transactions/types'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { Screens } from 'src/screens/Screens'

const PENDING_TX_TIME_LIMIT = 60_000 * 5 // 5 mins
const LOADING_SPINNER_SIZE = 26
const TEXT_OFFSET = 1

export function PendingNotificationBadge({ size = 24 }: { size?: number }) {
  const theme = useAppTheme()
  const activeAccountAddress = useAppSelector(selectActiveAccountAddress)
  const pendingTransactions = useSortedPendingTransactions(activeAccountAddress) ?? []
  const notifications = useAppSelector(selectActiveAccountNotifications)

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

  const pendingTransactionCount = pendingTransactions.length
  const txPendingLongerThanLimit =
    pendingTransactions[0] && Date.now() - pendingTransactions[0].addedTime > PENDING_TX_TIME_LIMIT

  // If a transaction has been pending for longer than 5 mins, don't show the spinner anymore
  if (pendingTransactionCount < 1 || pendingTransactionCount > 99 || txPendingLongerThanLimit)
    return null

  const countToDisplay = pendingTransactionCount === 1 ? undefined : pendingTransactionCount

  function onPress() {
    navigate(Screens.Profile)
  }

  return (
    <Button position="relative" onPress={onPress}>
      <Box
        alignItems="center"
        height={size}
        justifyContent="center"
        left={TEXT_OFFSET}
        position="absolute"
        top={TEXT_OFFSET}
        width={size}
        zIndex="modal">
        <Text textAlign="center" variant="badge">
          {countToDisplay}
        </Text>
      </Box>
      <SpinningLoader size={LOADING_SPINNER_SIZE} />
    </Button>
  )
}
