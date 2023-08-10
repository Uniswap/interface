import React from 'react'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { useEagerActivityNavigation } from 'src/app/navigation/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { Box } from 'src/components/layout/Box'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Text } from 'src/components/Text'
import { useSelectAddressHasNotifications } from 'src/features/notifications/hooks'
import { selectActiveAccountNotifications } from 'src/features/notifications/selectors'
import { useSortedPendingTransactions } from 'src/features/transactions/hooks'
import AlertCircle from 'ui/src/assets/icons/alert-circle.svg'
import { theme as FixedTheme } from 'ui/src/theme/restyle/theme'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { TransactionStatus } from 'wallet/src/features/transactions/types'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

const PENDING_TX_TIME_LIMIT = 60_000 * 5 // 5 mins
const LOADING_SPINNER_SIZE = FixedTheme.iconSizes.icon20

interface Props {
  size?: number
}

export function PendingNotificationBadge({
  size = LOADING_SPINNER_SIZE,
}: Props): JSX.Element | null {
  const theme = useAppTheme()
  const activeAccountAddress = useAppSelector(selectActiveAccountAddress)
  const notifications = useAppSelector(selectActiveAccountNotifications)
  const sortedPendingTransactions = useSortedPendingTransactions(activeAccountAddress)
  const hasNotifications = useSelectAddressHasNotifications(activeAccountAddress)

  const { preload, navigate } = useEagerActivityNavigation()

  /*************** In-app txn confirmed  **************/

  const currentNotification = notifications?.[0]
  if (currentNotification?.type === AppNotificationType.Transaction) {
    const { txStatus } = currentNotification
    if (txStatus === TransactionStatus.Success) {
      return (
        <CheckmarkCircle
          borderColor="statusSuccess"
          borderWidth={2}
          checkmarkStrokeWidth={3}
          color={theme.colors.statusSuccess}
          size={size}
        />
      )
    }

    return <AlertCircle color={theme.colors.DEP_accentWarning} height={size} width={size} />
  }

  /*************** Pending in-app txn  **************/

  const pendingTransactionCount = (sortedPendingTransactions ?? []).length
  const txPendingLongerThanLimit =
    sortedPendingTransactions?.[0] &&
    Date.now() - sortedPendingTransactions[0].addedTime > PENDING_TX_TIME_LIMIT

  // If a transaction has been pending for longer than 5 mins, then don't show the pending icon anymore
  if (pendingTransactionCount >= 1 && pendingTransactionCount <= 99 && !txPendingLongerThanLimit) {
    const countToDisplay = pendingTransactionCount === 1 ? undefined : pendingTransactionCount

    return (
      <TouchableArea
        position="relative"
        onPress={activeAccountAddress ? navigate : (): void => undefined}
        onPressIn={async (): Promise<void | null> =>
          activeAccountAddress ? await preload(activeAccountAddress) : null
        }>
        <Box
          alignItems="center"
          height={size}
          justifyContent="center"
          position="absolute"
          width={size}
          zIndex="modal">
          <Text color="neutral2" fontSize={8} textAlign="center" variant="buttonLabelMicro">
            {countToDisplay}
          </Text>
        </Box>
        <SpinningLoader size={LOADING_SPINNER_SIZE} />
      </TouchableArea>
    )
  }

  /**
   Has unchecked notification status (triggered by Transaction history updater or transaction watcher saga).
   Aka, will flip status to true when any local or remote transaction is confirmed.
  **/

  if (hasNotifications) {
    return (
      <Box
        backgroundColor="accent1"
        borderRadius="roundedFull"
        height={theme.iconSizes.icon8}
        width={theme.iconSizes.icon8}
      />
    )
  }

  return null
}
