import React, { memo, PropsWithChildren } from 'react'
import { Flex } from 'ui/src'
import { useSelectAddressHasNotifications } from 'wallet/src/features/notifications/hooks'

type Props = PropsWithChildren<{
  address: Address
}>

const NOTIFICATION_DOT_SIZE = 12

function _NotificationBadge({ children, address }: Props): JSX.Element {
  const hasNotifications = useSelectAddressHasNotifications(address)
  return (
    <Flex position="relative">
      {hasNotifications ? (
        <Flex
          backgroundColor="$accent1"
          borderColor="$surface2"
          borderRadius="$roundedFull"
          borderWidth={2}
          height={NOTIFICATION_DOT_SIZE}
          position="absolute"
          right={-NOTIFICATION_DOT_SIZE / 4}
          top={NOTIFICATION_DOT_SIZE / 8}
          width={NOTIFICATION_DOT_SIZE}
          zIndex="$popover"
        />
      ) : null}
      {children}
    </Flex>
  )
}

export const NotificationBadge = memo(_NotificationBadge)
