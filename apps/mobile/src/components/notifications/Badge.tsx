import React, { memo, PropsWithChildren } from 'react'
import { useSelectAddressHasNotifications } from 'src/features/notifications/hooks'
import { Flex } from 'ui/src'

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
