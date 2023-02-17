import React, { memo, PropsWithChildren } from 'react'
import { Box } from 'src/components/layout/Box'

type Props = PropsWithChildren<{
  showIndicator?: boolean
}>

const NOTIFICATION_DOT_SIZE = 8

function _NotificationBadge({ showIndicator, children }: Props): JSX.Element {
  return (
    <Box height="100%" position="relative">
      {showIndicator ? (
        <Box
          backgroundColor="userThemeMagenta"
          borderRadius="roundedFull"
          height={NOTIFICATION_DOT_SIZE}
          position="absolute"
          right={-NOTIFICATION_DOT_SIZE}
          top={NOTIFICATION_DOT_SIZE / 2}
          width={NOTIFICATION_DOT_SIZE}
          zIndex="popover"
        />
      ) : null}
      {children}
    </Box>
  )
}

export const NotificationBadge = memo(_NotificationBadge)
