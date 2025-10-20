import React from 'react'
import { ScantasticCompleteNotification } from 'src/features/notifications/ScantasticCompleteNotification'
import { WCNotification } from 'src/features/notifications/WCNotification'
import { useSelectAddressNotifications } from 'uniswap/src/features/notifications/slice/hooks'
import { AppNotification, AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { WalletNotificationToastRouter } from 'wallet/src/features/notifications/components/SharedNotificationToastRouter'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

export function NotificationToastWrapper(): JSX.Element | null {
  const activeAccountAddress = useActiveAccountAddress()
  const notifications = useSelectAddressNotifications(activeAccountAddress)
  const notification = notifications?.[0]

  if (!notification) {
    return null
  }

  return <NotificationToastRouter notification={notification} />
}

function NotificationToastRouter({ notification }: { notification: AppNotification }): JSX.Element | null {
  // Insert Mobile-only notifications here.
  // Shared wallet notifications should go in SharedNotificationToastRouter.
  switch (notification.type) {
    case AppNotificationType.WalletConnect:
      return <WCNotification notification={notification} />
    case AppNotificationType.ScantasticComplete:
      return <ScantasticCompleteNotification notification={notification} />
  }

  return <WalletNotificationToastRouter notification={notification} />
}
