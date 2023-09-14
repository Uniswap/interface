import React from 'react'
import { useAppSelector } from 'src/app/hooks'
import { useEagerActivityNavigation } from 'src/app/navigation/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Text } from 'src/components/Text'
import { useSelectAddressHasNotifications } from 'src/features/notifications/hooks'
import { selectActiveAccountNotifications } from 'src/features/notifications/selectors'
import { useSortedPendingTransactions } from 'src/features/transactions/hooks'
import { Flex, useSporeColors } from 'ui/src'
import AlertCircle from 'ui/src/assets/icons/alert-circle.svg'
import { iconSizes } from 'ui/src/theme'
import { theme as FixedTheme } from 'ui/src/theme/restyle'
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
        <Flex
          alignItems="center"
          gap="$none"
          height={size}
          justifyContent="center"
          position="absolute"
          width={size}
          zIndex="$modal">
          <Text color="neutral2" fontSize={8} textAlign="center" variant="buttonLabelMicro">
            {countToDisplay}
          </Text>
        </Flex>
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
      <Flex
        backgroundColor="$accent1"
        borderRadius="$roundedFull"
        gap="$none"
        height={iconSizes.icon8}
        width={iconSizes.icon8}
      />
    )
  }

  return null
}
