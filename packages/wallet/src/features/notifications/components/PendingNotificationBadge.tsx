import { Flex, SpinningLoader } from 'ui/src'
import { AlertCircle, CheckmarkCircle } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import {
  useSelectAddressHasNotifications,
  useSelectAddressNotifications,
} from 'uniswap/src/features/notifications/slice/hooks'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { useSortedPendingTransactions } from 'uniswap/src/features/transactions/hooks/usePendingTransactions'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const PENDING_TX_TIME_LIMIT = 60_000 * 5 // 5 mins
const LOADING_SPINNER_SIZE = iconSizes.icon20

interface Props {
  size?: number
}

export function PendingNotificationBadge({ size = LOADING_SPINNER_SIZE }: Props): JSX.Element | null {
  const activeAccountAddress = useActiveAccountAddress()
  const sortedPendingTransactions = useSortedPendingTransactions({ evmAddress: activeAccountAddress, svmAddress: null })
  const hasNotifications = useSelectAddressHasNotifications(activeAccountAddress)
  const notifications = useSelectAddressNotifications(activeAccountAddress)

  /*************** In-app txn confirmed  **************/

  const currentNotification = notifications?.[0]
  if (currentNotification?.type === AppNotificationType.Transaction) {
    const { txStatus } = currentNotification
    if (txStatus === TransactionStatus.Success) {
      return <CheckmarkCircle size={size} />
    }

    return <AlertCircle color="$statusWarning" size={size} />
  }

  /*************** Pending in-app txn  **************/

  const swapPendingNotificationActive = currentNotification?.type === AppNotificationType.SwapPending
  const pendingTransactionCount = (sortedPendingTransactions ?? []).length
  const txPendingLongerThanLimit =
    sortedPendingTransactions?.[0] && Date.now() - sortedPendingTransactions[0].addedTime > PENDING_TX_TIME_LIMIT

  // If a transaction has been pending for longer than 5 mins, then don't show the pending icon anymore
  // Dont show the loader if the swap pending toast is on screen
  if (
    !swapPendingNotificationActive &&
    pendingTransactionCount >= 1 &&
    pendingTransactionCount <= 99 &&
    !txPendingLongerThanLimit
  ) {
    return <SpinningLoader color="$accent1" size={LOADING_SPINNER_SIZE} />
  }

  /**
   Has unchecked notification status (triggered by Transaction history updater or transaction watcher saga).
   Aka, will flip status to true when any local or remote transaction is confirmed.
  **/

  if (hasNotifications) {
    return (
      <Flex backgroundColor="$accent1" borderRadius="$roundedFull" height={iconSizes.icon8} width={iconSizes.icon8} />
    )
  }

  return null
}
