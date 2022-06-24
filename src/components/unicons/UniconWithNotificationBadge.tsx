import React from 'react'
import { NotificationBadge } from 'src/components/notifications/Badge'
import { Unicon } from 'src/components/unicons/Unicon'
import { useSelectAddressNotificationCount } from 'src/features/notifications/hooks'

interface Props {
  address: string
  size: number
}

export function UniconWithNotificationBadge({ address, size }: Props) {
  const notificationCount = useSelectAddressNotificationCount(address)

  if (!notificationCount) {
    return <Unicon address={address} size={size} />
  }

  return (
    <NotificationBadge backgroundColor="accentAction" notificationCount={notificationCount}>
      <Unicon address={address} size={size} />
    </NotificationBadge>
  )
}
