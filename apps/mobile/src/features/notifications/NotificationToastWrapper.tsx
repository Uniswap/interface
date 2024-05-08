import React from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ScantasticCompleteNotification } from 'src/features/notifications/ScantasticCompleteNotification'
import { WCNotification } from 'src/features/notifications/WCNotification'
import { SharedNotificationToastRouter } from 'wallet/src/features/notifications/components/SharedNotificationToastRouter'
import { selectActiveAccountNotifications } from 'wallet/src/features/notifications/selectors'
import { AppNotification, AppNotificationType } from 'wallet/src/features/notifications/types'

export function NotificationToastWrapper(): JSX.Element | null {
  const notifications = useAppSelector(selectActiveAccountNotifications)
  const notification = notifications?.[0]

  if (!notification) {
    return null
  }

  return <NotificationToastRouter notification={notification} />
}

function NotificationToastRouter({
  notification,
}: {
  notification: AppNotification
}): JSX.Element | null {
  // Insert Mobile-only notifications here.
  // Shared wallet notifications should go in SharedNotificationToastRouter.
  switch (notification.type) {
    case AppNotificationType.WalletConnect:
      return <WCNotification notification={notification} />
    case AppNotificationType.ScantasticComplete:
      return <ScantasticCompleteNotification notification={notification} />
  }

  return <SharedNotificationToastRouter notification={notification} />
}
