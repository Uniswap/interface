import React, { ComponentProps, PropsWithChildren } from 'react'
import { Box } from 'src/components/layout/Box'

type Props = ComponentProps<typeof Box>

// This is meant for screens displayed as 'sheets'
// I.e. under a presentation: modal nav setting
// It doesn't use SafeAreaView which would create inconsistent
// top-bottom padding appearance on different iOS devices
export function SheetScreen(props: PropsWithChildren<Props>) {
  return (
    <Box flex={1} bg="mainBackground" py="lg" {...props}>
      {props.children}
    </Box>
  )
}
