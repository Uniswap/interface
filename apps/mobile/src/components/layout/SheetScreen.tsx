import React from 'react'
import { Flex, FlexProps } from 'ui/src'

// This is meant for screens displayed as 'sheets'
// I.e. under a presentation: modal nav setting
// It doesn't use SafeAreaView which would create inconsistent
// top-bottom padding appearance on different iOS devices
export function SheetScreen(props: FlexProps): JSX.Element {
  return (
    <Flex fill bg="$surface1" py="$spacing24" {...props}>
      {props.children}
    </Flex>
  )
}
