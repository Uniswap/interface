import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { DEFAULT_TOAST_HIDE_DELAY, SPRING_ANIMATION_DELAY } from 'uniswap/src/features/notifications/constants'
import { useSelectAddressNotifications } from 'uniswap/src/features/notifications/slice/hooks'
import { popNotification, setNotificationViewed } from 'uniswap/src/features/notifications/slice/slice'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { useTimeout } from 'utilities/src/time/timing'

interface NotificationLifecycleProps {
  address?: string
  hideDelay?: number
  onPress?: () => void
  onDismissLatest?: () => void
  onShowCurrentNotification?: () => void
  actionButtonOnPress?: () => void
}

export function useNotificationLifecycle({
  address,
  hideDelay,
  onPress,
  onShowCurrentNotification,
  onDismissLatest,
  actionButtonOnPress,
}: NotificationLifecycleProps): {
  onActionButtonPress: () => void
  onNotificationPress: () => void
  cancelDismiss: () => void
  dismissLatest: () => void
} {
  const dispatch = useDispatch()
  const { evmAccount } = useWallet()
  const notifications = useSelectAddressNotifications(evmAccount?.address ?? null)
  const currentNotification = notifications?.[0]
  const hasQueuedNotification = !!notifications?.[1]

  // biome-ignore lint/correctness/useExhaustiveDependencies: Run this only once to ensure that if a new notification is created it doesn't show on the next screen
  useEffect(() => {
    if (currentNotification?.shown) {
      dispatch(popNotification({ address }))
    }
  }, [address, dispatch])

  useEffect(() => {
    if (currentNotification) {
      onShowCurrentNotification?.()
      // delay to ensure the notification is shown if theres a quick navigation event
      setTimeout(() => {
        dispatch(setNotificationViewed({ address }))
      }, SPRING_ANIMATION_DELAY * 2)
    }
  }, [currentNotification, dispatch, address, onShowCurrentNotification])

  const dismissLatest = useCallback(() => {
    onDismissLatest?.()
    setTimeout(() => dispatch(popNotification({ address })), 500)
  }, [address, dispatch, onDismissLatest])

  // If there is another notification in the queue then hide the current one immediately
  const delay = hasQueuedNotification ? 0 : (hideDelay ?? DEFAULT_TOAST_HIDE_DELAY)
  const cancelDismiss = useTimeout(dismissLatest, delay)

  const onNotificationPress = (): void => {
    cancelDismiss()
    if (onPress) {
      dispatch(popNotification({ address }))
      onPress()
    } else {
      dismissLatest()
    }
  }

  const onActionButtonPress = (): void => {
    cancelDismiss()
    dismissLatest()
    actionButtonOnPress?.()
  }

  return { onActionButtonPress, onNotificationPress, cancelDismiss, dismissLatest }
}
