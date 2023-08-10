import React from 'react'
import { Box, BoxProps } from 'src/components/layout/Box'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'

// This is meant for screens displayed as 'sheets'
// I.e. under a presentation: modal nav setting
// It doesn't use SafeAreaView which would create inconsistent
// top-bottom padding appearance on different iOS devices
export function SheetScreen(props: BoxProps): JSX.Element {
  return (
    <Box bg="surface1" flex={1} py="spacing24" {...props}>
      {/* Need to include toast here because nothing can be rendered on top of `SheetScreen` */}
      <NotificationToastWrapper />
      {props.children}
    </Box>
  )
}
