import React from 'react'
import { Identicon } from 'src/components/accounts/Identicon'
import { NotificationBadge } from 'src/components/notifications/Badge'
import { useSelectAddressNotificationCount } from 'src/features/notifications/hooks'

interface Props {
  address: string
  size: number
}

export function IdenticonWithNotificationBadge({ address, size }: Props) {
  const notificationCount = useSelectAddressNotificationCount(address)

  if (!notificationCount) {
    return <Identicon address={address} size={size} />
  }

  return (
    <NotificationBadge backgroundColor="accentAction" notificationCount={notificationCount}>
      <Identicon address={address} size={size} />
    </NotificationBadge>
  )
}
