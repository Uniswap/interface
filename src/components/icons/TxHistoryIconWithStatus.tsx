import React, { memo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import BellIcon from 'src/assets/icons/bell.svg'
import { NotificationBadge } from 'src/components/notifications/Badge'
import { useSelectAddressHasNotifications } from 'src/features/notifications/hooks'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { iconSizes } from 'src/styles/sizing'

type Props = {
  size?: number
}

function _TxHistoryIconWithStatus({ size = iconSizes.lg }: Props): JSX.Element {
  const theme = useAppTheme()
  const address = useActiveAccountAddressWithThrow()
  const hasNotifications = useSelectAddressHasNotifications(address)

  return (
    <NotificationBadge borderColor="backgroundBranded" showIndicator={hasNotifications}>
      <BellIcon color={theme.colors.textSecondary} height={size} width={size} />
    </NotificationBadge>
  )
}

export const TxHistoryIconWithStatus = memo(_TxHistoryIconWithStatus)
