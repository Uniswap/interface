import { Platform } from '@universe/chains'
import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { DEFAULT_TOAST_HIDE_DELAY, SPRING_ANIMATION_DELAY } from 'uniswap/src/features/notifications/constants'
import { useSelectAddressNotifications } from 'uniswap/src/features/notifications/slice/hooks'
import { popNotification, setNotificationViewed } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { useTimeout } from 'utilities/src/time/timing'

interface NotificationLifecycleProps {
  address?: string
  hideDelay?: number
  isDismissPaused?: boolean
  onPress?: () => void
  onDismissLatest?: () => void
  onShowCurrentNotification?: () => void
  actionButtonOnPress?: () => void
}

export function useNotificationLifecycle({
  address,
  hideDelay,
  isDismissPaused,
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
  const evmAddress = useActiveAddress(Platform.EVM)
  const notifications = useSelectAddressNotifications(evmAddress ?? null)
  const scope = address ?? evmAddress ?? undefined
  const currentNotification = notifications?.[0]
  const hasQueuedNotification =
    notifications?.slice(1).some((notification) => notification.type !== AppNotificationType.EarnSwapUpsell) ?? false

  useEffect(() => {
    if (currentNotification?.shown) {
      dispatch(popNotification({ address: scope }))
    }
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [scope, dispatch])

  useEffect(() => {
    if (currentNotification) {
      onShowCurrentNotification?.()
      // delay to ensure the notification is shown if theres a quick navigation event
      setTimeout(() => {
        dispatch(setNotificationViewed({ address: scope }))
      }, SPRING_ANIMATION_DELAY * 2)
    }
  }, [currentNotification, dispatch, scope, onShowCurrentNotification])

  const dismissLatest = useCallback(() => {
    onDismissLatest?.()
    setTimeout(() => dispatch(popNotification({ address: scope })), 500)
  }, [scope, dispatch, onDismissLatest])

  // If there is another notification in the queue then hide the current one immediately
  const delay = hasQueuedNotification ? 0 : (hideDelay ?? DEFAULT_TOAST_HIDE_DELAY)
  // useTimeout skips negative delays; unpausing restarts the full delay
  const cancelDismiss = useTimeout(dismissLatest, isDismissPaused ? -1 : delay)

  const onNotificationPress = (): void => {
    cancelDismiss()
    if (onPress) {
      dispatch(popNotification({ address: scope }))
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
