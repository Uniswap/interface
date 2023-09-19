import React from 'react'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'
import { Flex, FlexProps } from 'ui/src'

// This is meant for screens displayed as 'sheets'
// I.e. under a presentation: modal nav setting
// It doesn't use SafeAreaView which would create inconsistent
// top-bottom padding appearance on different iOS devices
export function SheetScreen(props: FlexProps): JSX.Element {
  return (
    <Flex fill bg="$surface1" py="$spacing24" {...props}>
      {/* Need to include toast here because nothing can be rendered on top of `SheetScreen` */}
      <NotificationToastWrapper />
      {props.children}
    </Flex>
  )
}
