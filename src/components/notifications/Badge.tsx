import { BackgroundColorProps, BackgroundColorShorthandProps } from '@shopify/restyle'
import React, { memo, PropsWithChildren } from 'react'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

const NOTIFICATION_BADGE_SIZE = 20

type Props = {
  children: PropsWithChildren<any>
  size?: number
  notificationCount?: number
} & BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme>

function _NotificationBadge({
  children,
  size = NOTIFICATION_BADGE_SIZE,
  backgroundColor,
  notificationCount,
}: Props) {
  return (
    <Box position="relative">
      {children}
      <Flex
        centered
        backgroundColor={backgroundColor}
        borderRadius="full"
        borderWidth={2}
        minHeight={size}
        minWidth={size}
        position="absolute"
        px="xxxs"
        right={-size / 3.5}
        top={-size / 3.5}>
        {notificationCount ? (
          <Text numberOfLines={1} textAlign="center" variant="badge">
            {formatNotificationCount(notificationCount)}
          </Text>
        ) : null}
      </Flex>
    </Box>
  )
}

export const NotificationBadge = memo(_NotificationBadge)

const formatNotificationCount = (count: number) => {
  if (count <= 99) return count.toString()
  return '99+'
}
