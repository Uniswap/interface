import React, { memo } from 'react'
import Clock from 'src/assets/icons/clock.svg'
import { Box } from 'src/components/layout/Box'
import { NotificationBadge } from 'src/components/notifications/Badge'
import { theme } from 'src/styles/theme'

const NOTIFICATION_DOT_SIZE = 12

type Props = {
  size?: number
  color?: string
  pendingTxCount?: number
  unreadNotifications?: boolean
}

function _ClockWithStatus({
  size = 24,
  color = theme.colors.neutralTextTertiary,
  pendingTxCount,
  unreadNotifications,
}: Props) {
  if (pendingTxCount) {
    return (
      <NotificationBadge
        backgroundColor="accentBackgroundActive"
        notificationCount={pendingTxCount}>
        <Clock color={color} height={size} width={size} />
      </NotificationBadge>
    )
  }

  if (unreadNotifications) {
    return (
      <Box position="relative">
        <Clock color={color} height={size} width={size} />
        <Box
          backgroundColor="accentBackgroundAction"
          borderRadius="full"
          borderWidth={2}
          height={NOTIFICATION_DOT_SIZE}
          position="absolute"
          right={-NOTIFICATION_DOT_SIZE / 10}
          top={-NOTIFICATION_DOT_SIZE / 10}
          width={NOTIFICATION_DOT_SIZE}
        />
      </Box>
    )
  }

  return <Clock color={color} height={size} width={size} />
}

export const ClockWithStatus = memo(_ClockWithStatus)
