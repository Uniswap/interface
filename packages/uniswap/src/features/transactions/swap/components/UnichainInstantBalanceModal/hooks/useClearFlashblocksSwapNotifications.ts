import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSelectAddressNotifications } from 'uniswap/src/features/notifications/slice/hooks'
import { clearNotificationQueue } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

/**
 * Clears the notification queue when the provided `trigger` flag is true **and**
 * all current notifications are related to the in-progress swap (pending or completed).
 * Helps hide swap-related toasts (pending/completed) during flash-block flows.
 */
export function useClearFlashblocksSwapNotifications(isClearingNotifications: boolean): void {
  const dispatch = useDispatch()
  const accountAddress = useWallet().evmAccount?.address
  const addressNotifications = useSelectAddressNotifications(accountAddress ?? null)

  const shouldClearNotifications = useMemo(() => {
    if (!isClearingNotifications || !addressNotifications || addressNotifications.length === 0) {
      return false
    }

    // Only clear if **all** notifications in the queue match the current swap context
    return addressNotifications.every((notif) => {
      if (notif.type === AppNotificationType.SwapPending) {
        return true
      }

      if (notif.type === AppNotificationType.Transaction && 'txType' in notif) {
        return (
          notif.txType === TransactionType.Swap &&
          // ensure we only clear toasts that belong to this swap tx
          ('chainId' in notif
            ? notif.chainId === UniverseChainId.Unichain || notif.chainId === UniverseChainId.UnichainSepolia
            : false)
        )
      }

      return false
    })
  }, [isClearingNotifications, addressNotifications])

  useEffect(() => {
    if (shouldClearNotifications) {
      dispatch(clearNotificationQueue())
    }
  }, [shouldClearNotifications, dispatch])
}
