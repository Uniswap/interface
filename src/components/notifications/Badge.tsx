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
      {notificationCount ? (
        <Box alignItems="center" right={-size / 1.5} top={-size / 2} zIndex="popover">
          <Flex
            centered
            backgroundColor={backgroundColor}
            borderRadius="full"
            borderWidth={2}
            height={size}
            minWidth={size}
            position="absolute">
            <Text numberOfLines={1} p="xxs" textAlign="center" variant="badge">
              {formatNotificationCount(notificationCount)}
            </Text>
          </Flex>
        </Box>
      ) : null}
      {children}
    </Box>
  )
}

export const NotificationBadge = memo(_NotificationBadge)

const formatNotificationCount = (count: number) => {
  if (count <= 99) return count.toString()
  return '99+'
}
