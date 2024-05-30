import React from 'react'
import { useAppSelector } from 'src/app/hooks'
import { useEagerActivityNavigation } from 'src/app/navigation/hooks'
import { Flex, TouchableArea, useSporeColors } from 'ui/src'
import AlertCircle from 'ui/src/assets/icons/alert-circle.svg'
import { iconSizes } from 'ui/src/theme'
import { CheckmarkCircle } from 'wallet/src/components/icons/CheckmarkCircle'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { useSelectAddressHasNotifications } from 'wallet/src/features/notifications/hooks'
import { selectActiveAccountNotifications } from 'wallet/src/features/notifications/selectors'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useSortedPendingTransactions } from 'wallet/src/features/transactions/hooks'
import { TransactionStatus } from 'wallet/src/features/transactions/types'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

const PENDING_TX_TIME_LIMIT = 60_000 * 5 // 5 mins
const LOADING_SPINNER_SIZE = iconSizes.icon20

interface Props {
  size?: number
}

export function PendingNotificationBadge({
  size = LOADING_SPINNER_SIZE,
}: Props): JSX.Element | null {
  const colors = useSporeColors()
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
          borderColor="$statusSuccess"
          borderWidth={2}
          checkmarkStrokeWidth={3}
          color={colors.statusSuccess.val}
          size={size}
        />
      )
    }

    return <AlertCircle color={colors.DEP_accentWarning.val} height={size} width={size} />
  }

  /*************** Pending in-app txn  **************/

  const swapPendingNotificationActive =
    currentNotification?.type === AppNotificationType.SwapPending
  const pendingTransactionCount = (sortedPendingTransactions ?? []).length
  const txPendingLongerThanLimit =
    sortedPendingTransactions?.[0] &&
    Date.now() - sortedPendingTransactions[0].addedTime > PENDING_TX_TIME_LIMIT

  // If a transaction has been pending for longer than 5 mins, then don't show the pending icon anymore
  // Dont show the loader if the swap pending toast is on screen
  if (
    !swapPendingNotificationActive &&
    pendingTransactionCount >= 1 &&
    pendingTransactionCount <= 99 &&
    !txPendingLongerThanLimit
  ) {
    return (
      <TouchableArea
        position="relative"
        onPress={activeAccountAddress ? navigate : (): void => undefined}
        onPressIn={async (): Promise<void | null> =>
          activeAccountAddress ? await preload(activeAccountAddress) : null
        }>
        <SpinningLoader color="$accent1" size={LOADING_SPINNER_SIZE} />
      </TouchableArea>
    )
  }

  /**
   Has unchecked notification status (triggered by Transaction history updater or transaction watcher saga).
   Aka, will flip status to true when any local or remote transaction is confirmed.
  **/

  if (hasNotifications) {
    return (
      <Flex
        backgroundColor="$accent1"
        borderRadius="$roundedFull"
        height={iconSizes.icon8}
        width={iconSizes.icon8}
      />
    )
  }

  return null
}
